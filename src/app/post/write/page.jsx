'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import '../update/update.css';
import { fetchVisibleBoards } from "@/app/post/boardList";

// useSearchParams를 사용하는 컴포넌트를 분리
function PostWriteContent() {
    const router = useRouter();

    // 게시글 작성 시 게시판 자동 입력
    const searchParams = useSearchParams();
    const boardIdxFromURL = searchParams.get('board_idx');

    // 게시판 익명 여부 확인
    const [isAnonymousBoard, setIsAnonymousBoard] = useState(false);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [board, setBoard] = useState(boardIdxFromURL || '');
    const [allowComment, setAllowComment] = useState(true);

    const [writer, setWriter] = useState('');

    const [newFiles, setNewFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    // 에러 메시지 상태 추가
    const [imageError, setImageError] = useState('');

    const [boards, setBoards] = useState([]);

    const applyBoardSettings = (board_idx_str, boardList) => {
        const selected = boardList.find(b => b.board_idx.toString() === board_idx_str);
        if (!selected) return;

        setBoard(selected.board_idx.toString());
        setIsAnonymousBoard(selected.anony_yn === true);

        // 🔥 작성자 설정은 여기서만 하고 절대 다른 데선 안 건드리기
        if (selected.anony_yn === true) {
            setWriter('익명');
        } else {
            const id = sessionStorage.getItem('id');
            setWriter(id || '');
        }
    };

    useEffect(() => {
        console.log('👀 현재 writer 값:', writer);
    }, [writer]);

    useEffect(() => {
        fetchVisibleBoards().then((boards) => {
            setBoards(boards);
            console.log(boards)
            if (boardIdxFromURL) {
                applyBoardSettings(boardIdxFromURL, boards);
            }
        });
    }, []);

    const handleBoardChange = (e) => {
        const value = e.target.value;
        applyBoardSettings(value, boards);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // 파일 개수 검증
        if (newFiles.length + files.length > 10) {
            setImageError('이미지는 최대 10장까지만 업로드할 수 있습니다.');
            return;
        }

        // 현재 선택된 파일들의 총 크기 계산
        const currentTotalSize = newFiles.reduce((total, file) => total + file.size, 0);
        const newFilesSize = files.reduce((total, file) => total + file.size, 0);
        const totalSize = currentTotalSize + newFilesSize;

        // 총 파일 크기 검증 (10MB = 10 * 1024 * 1024 바이트)
        if (totalSize > 10 * 1024 * 1024) {
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            setImageError(`이미지 총 용량이 제한을 초과합니다: ${totalSizeMB}MB (최대 10MB)`);
            return;
        }

        // 에러 메시지 초기화
        setImageError('');

        const readers = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ url: reader.result, file });
                reader.readAsDataURL(file);
            });
        });
        Promise.all(readers).then(results => {
            setNewFiles(prev => [...prev, ...results.map(r => r.file)]);
            setPreviewUrls(prev => [...prev, ...results.map(r => r.url)]);
        });
    };

    const handleRemoveNewFile = (index) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));

        // 파일 삭제 시 에러 메시지 초기화
        setImageError('');
    };

    const validateForm = () => {
        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return false;
        }

        if (!content.trim()) {
            alert('내용을 입력해주세요.');
            return false;
        }

        if (!board) {
            alert('게시판을 선택해주세요.');
            return false;
        }

        if (imageError) {
            alert(imageError);
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        // 폼 유효성 검사
        if (!validateForm()) return;

        const token = sessionStorage.getItem('token');
        if (!token) {
            alert("로그인이 필요합니다.");
            return router.push('/login');
        }

        try {
            // 이미지가 있을 경우, 총 용량 확인
            if (newFiles.length > 0) {
                const totalSize = newFiles.reduce((total, file) => total + file.size, 0);
                if (totalSize > 10 * 1024 * 1024) {
                    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
                    alert(`이미지 총 용량이 제한을 초과합니다: ${totalSizeMB}MB (최대 10MB)`);
                    return;
                }
            }

            // 디버그 로그 추가: 서버로 전송하기 전 allowComment 값 확인
            console.log('게시글 작성 - 댓글 허용 여부(프론트엔드):', allowComment);

            const postRes = await axios.post('http://localhost/post/write', {
                post_title: title,
                post_content: content,
                board_idx: parseInt(board),
                com_yn: allowComment,
                anony_yn: isAnonymousBoard,
                post_blind_yn: false,
                id: writer,
            }, {
                headers: { Authorization: token },
            });

            if (!postRes.data.success) {
                alert('게시글 등록 실패');
                return;
            }

            const postIdx = postRes.data.idx;

            if (newFiles.length > 0) {
                const form = new FormData();
                form.append('post_idx', postIdx);
                newFiles.forEach(file => form.append('files', file));

                const fileRes = await axios.post('http://localhost/post/file/upload', form, {
                    headers: { Authorization: token },
                });

                if (!fileRes.data.success) {
                    // 파일 업로드 실패 시 서버에서 전달된 메시지 표시
                    const errorMessage = fileRes.data.message || '파일 업로드 실패';
                    alert(errorMessage);

                    // 게시글은 작성되었지만 파일 업로드가 실패한 경우 게시글 삭제 요청
                    try {
                        await axios.put('http://localhost/post/delete', {
                            post_idx: postIdx
                        }, {
                            headers: { Authorization: token }
                        });
                        alert('파일 업로드 실패로 게시글이 삭제되었습니다.');
                    } catch (deleteError) {
                        console.error('게시글 삭제 중 오류 발생:', deleteError);
                    }

                    return;
                }
            }

            alert('게시글이 등록되었습니다.');
            router.push(`/post/detail?post_idx=${postIdx}&board_idx=${board}`);
        } catch (error) {
            console.error('게시글 등록 중 오류 발생:', error);
            alert('게시글 등록 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="update-container">
            <h2 className="update-title">게시글 작성</h2>

            <div className="form-row">
                <label>제목</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력해주세요." />
            </div>

            <div className="form-row">
                <label>작성자</label>
                <input
                    type="text"
                    value={isAnonymousBoard ? '익명' : writer}
                    readOnly
                />
            </div>

            <div className="form-row">
                <label>댓글 허용 여부</label>
                <div className="radio-group">
                    <label><input type="radio" name="allowComment" checked={allowComment} onChange={() => setAllowComment(true)} /> 허용</label>
                    <label style={{ marginLeft: '1rem' }}><input type="radio" name="allowComment" checked={!allowComment} onChange={() => setAllowComment(false)} /> 허용 안함</label>
                </div>
            </div>

            <div className="form-row">
                <label>게시판</label>
                <select value={board} onChange={handleBoardChange}>
                    <option value="">게시판을 선택해주세요</option>
                    {boards.map((b) => (
                        <option key={b.board_idx} value={b.board_idx}>
                            {b.board_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-row">
                <label>내용</label>
                <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력해주세요." />
            </div>

            <div className="form-row">
                <label>첨부파일</label>
                <input type="file" multiple onChange={handleFileChange} accept="image/jpeg,image/jpg,image/png" />
                {imageError && <p className="error-message" style={{ color: 'red', marginTop: '5px' }}>{imageError}</p>}
                <p className="file-info" style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                    * 이미지는 최대 10장까지, 각 파일은 10MB 이하만 업로드 가능합니다.
                </p>
                <div className="file-preview">
                    {previewUrls.map((url, idx) => (
                        <div key={idx} className="preview-item">
                            <img src={url} className="thumb" />
                            <button onClick={() => handleRemoveNewFile(idx)} className="delete-button">×</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="button-group">
                <button onClick={() => router.push(`/post?board_idx=${board}`)} className="cancel-button">목록</button>
                <button onClick={handleSubmit} className="submit-button">등록</button>
            </div>
        </div>
    );
}

// 메인 컴포넌트 - Suspense로 래핑
export default function PostWritePage() {
    return (
        <Suspense fallback={<div>로딩 중...</div>}>
            <PostWriteContent />
        </Suspense>
    );
}