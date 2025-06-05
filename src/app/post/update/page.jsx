'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import './update.css';
import {fetchVisibleBoards} from "@/app/post/boardList";

export default function PostUpdatePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const postIdx = searchParams.get('post_idx');

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [board, setBoard] = useState('');
    const [photos, setPhotos] = useState([]);
    const [keepFileIdx, setKeepFileIdx] = useState([]);

    const [allowComment, setAllowComment] = useState(true); // 댓글 허용 여부

    const [newFiles, setNewFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    
    // 에러 메시지 상태 추가
    const [imageError, setImageError] = useState('');

    const [boards, setBoards] = useState([]); // 게시판 목록

    useEffect(() => {
        if (postIdx) fetchPost();
        fetchVisibleBoards().then(setBoards);
    }, [postIdx]);

    const fetchPost = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost/post/detail/${postIdx}`, {
                headers: { Authorization: token },
            });
            if (res.data?.post) {
                setTitle(res.data.post.post_title);
                setContent(res.data.post.post_content);
                setBoard(String(res.data.post.board_idx || ''));
                setAllowComment(res.data.post.com_yn);
                setPhotos(res.data.photos || []);
                setKeepFileIdx(res.data.photos?.map(p => p.file_idx) || []);
            }
        } catch (err) {
            alert('게시글 정보 로딩 실패');
        }
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        
        // 파일 개수 검증 (기존 유지할 파일 + 새 파일)
        const totalFileCount = keepFileIdx.length + newFiles.length + fileArray.length;
        if (totalFileCount > 10) {
            setImageError('이미지는 최대 10장까지만 업로드할 수 있습니다.');
            return;
        }
        
        // 현재 선택된 파일들의 총 크기 계산
        const currentTotalSize = newFiles.reduce((total, file) => total + file.size, 0);
        const newFilesSize = fileArray.reduce((total, file) => total + file.size, 0);
        const totalSize = currentTotalSize + newFilesSize;
        
        // 총 파일 크기 검증 (10MB = 10 * 1024 * 1024 바이트)
        if (totalSize > 10 * 1024 * 1024) {
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            setImageError(`이미지 총 용량이 제한을 초과합니다: ${totalSizeMB}MB (최대 10MB)`);
            return;
        }
        
        // 에러 메시지 초기화
        setImageError('');

        const readers = fileArray.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({ url: reader.result, file });
                };
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
        // 에러 메시지 초기화
        setImageError('');
    };

    const handleToggleKeep = (fileIdx) => {
        setKeepFileIdx(prev =>
            prev.includes(fileIdx) ? prev.filter(f => f !== fileIdx) : [...prev, fileIdx]
        );
        // 파일 유지 상태 변경 시 에러 메시지 검증
        const totalFileCount = (prev => prev.includes(fileIdx) ? prev.filter(f => f !== fileIdx) : [...prev, fileIdx])(keepFileIdx).length + newFiles.length;
        if (totalFileCount > 10) {
            setImageError('이미지는 최대 10장까지만 업로드할 수 있습니다.');
        } else {
            setImageError('');
        }
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

    const handleUpdate = async () => {
        // 폼 유효성 검사
        if (!validateForm()) return;
        
        const token = sessionStorage.getItem('token');
        
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
            
            const updateRes = await axios.put('http://localhost/post/update', {
                post_idx: postIdx,
                post_title: title,
                post_content: content,
                board_idx: parseInt(board),
                com_yn: allowComment,
            }, {
                headers: { Authorization: token },
            });
    
            if (!updateRes.data.success) {
                alert('게시글 수정 실패');
                return;
            }
    
            const form = new FormData();
            form.append('post_idx', postIdx);
            keepFileIdx.forEach(idx => form.append('keepFileIdx', idx));
            newFiles.forEach(file => form.append('files', file));
    
            const fileRes = await axios.post('http://localhost/post/file/update', form, {
                headers: { Authorization: token },
            });
    
            if (!fileRes.data.success) {
                // 파일 업로드 실패 시 서버에서 전달된 메시지 표시
                const errorMessage = fileRes.data.message || '파일 수정 실패';
                alert(errorMessage);
                
                // 게시글은 수정되었지만 파일 업로드가 실패한 경우 게시글 상세 페이지로 이동
                router.push(`/post/detail?post_idx=${postIdx}&board_idx=${parseInt(board)}`);
                return;
            }
    
            alert('게시글이 수정되었습니다.');
            router.push(`/post/detail?post_idx=${postIdx}&board_idx=${parseInt(board)}`);
        } catch (error) {
            console.error('게시글 수정 중 오류 발생:', error);
            alert('게시글 수정 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="update-container">
            <h2 className="update-title">공지사항 게시판</h2>

            {/* 1. 제목 */}
            <div className="form-row">
                <label>제목</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력해주세요."
                />
            </div>

            {/* 2. 작성자 - readonly */}
            <div className="form-row">
                <label>작성자</label>
                <input type="text" value="admin" readOnly />
            </div>

            {/* 댓글 허용 여부 */}
            <div className="form-row">
                <label>댓글 허용 여부</label>
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="allowComment"
                            checked={allowComment === true}
                            onChange={() => setAllowComment(true)}
                        />
                        허용
                    </label>
                    <label style={{ marginLeft: '1rem' }}>
                        <input
                            type="radio"
                            name="allowComment"
                            checked={allowComment === false}
                            onChange={() => setAllowComment(false)}
                        />
                        허용 안함
                    </label>
                </div>
            </div>

            {/* 3. 게시판 선택 */}
            <div className="form-row">
                <label>게시판</label>
                <select value={board} onChange={(e) => setBoard(e.target.value)}>
                    <option value="">게시판을 선택해주세요</option>
                    {boards.map((b) => (
                        <option key={b.board_idx} value={b.board_idx}>
                            {b.board_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* 4. 내용 */}
            <div className="form-row">
                <label>내용</label>
                <textarea
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="내용을 입력해주세요."
                />
            </div>

            {/* 5. 첨부파일 */}
            <div className="form-row">
                <label>첨부파일</label>
                <input type="file" multiple onChange={handleFileChange} accept="image/jpeg,image/jpg,image/png" />
                {imageError && <p className="error-message" style={{ color: 'red', marginTop: '5px' }}>{imageError}</p>}
                <p className="file-info" style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                    * 이미지는 최대 10장까지, 각 파일은 10MB 이하만 업로드 가능합니다.
                </p>
                <div className="file-list">
                    {photos.map(p => (
                        <div key={p.file_idx} className="file-item">
                            <input
                                type="checkbox"
                                checked={keepFileIdx.includes(p.file_idx)}
                                onChange={() => handleToggleKeep(p.file_idx)}
                            />
                            <span>{p.file_name}</span>
                        </div>
                    ))}
                    {newFiles.length > 0 && (
                        <div className="file-new">
                            {newFiles.map((f, idx) => (
                                <div key={idx}>{f.name}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 기존 업로드된 사진 */}
            <div className="file-list">
                {photos.map(p => (
                    <div key={p.file_idx} className="file-item">
                        <input
                            type="checkbox"
                            checked={keepFileIdx.includes(p.file_idx)}
                            onChange={() => handleToggleKeep(p.file_idx)}
                        />
                        <img
                            src={`http://localhost/file/${p.file_url}`}
                            alt={p.file_name}
                            className="thumb"
                        />
                    </div>
                ))}
            </div>

            {/* 새로 업로드한 사진 */}
            {previewUrls.length > 0 && (
                <div className="file-preview">
                    {previewUrls.map((url, idx) => (
                        <div key={idx} className="preview-item">
                            <img src={url} className="thumb" />
                            <button onClick={() => handleRemoveNewFile(idx)} className="delete-button">×</button>
                        </div>
                    ))}
                </div>
            )}

            {/* 6. 버튼 */}
            <div className="button-group">
                <button onClick={() => router.push(`/post?board_idx=${board}`)} className="cancel-button">취소</button>
                <button onClick={handleUpdate} className="submit-button">등록</button>
            </div>
        </div>
    );
}
