'use client';

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import axios from 'axios';
import '../update/update.css';
import {fetchVisibleBoards} from "@/app/post/boardList";

export default function PostWritePage() {
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
    };

    const handleSubmit = async () => {
        if (!title || !content || !board) return alert('모든 항목을 입력하세요');

        const token = sessionStorage.getItem('token');
        if (!token) {
            alert("로그인이 필요합니다.");
            return router.push('/login');
        }

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

        if (!postRes.data.success) return alert('게시글 등록 실패');
        const postIdx = postRes.data.idx;

        if (newFiles.length > 0) {
            const form = new FormData();
            form.append('post_idx', postIdx);
            newFiles.forEach(file => form.append('files', file));

            const fileRes = await axios.post('http://localhost/post/file/upload', form, {
                headers: { Authorization: token },
            });

            if (!fileRes.data.success) return alert('파일 업로드 실패');
        }

        alert('게시글이 등록되었습니다.');
        router.push(`/post/detail?post_idx=${postIdx}&board_idx=${board}`);
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
                <input type="file" multiple onChange={handleFileChange} />
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
                <button onClick={() => router.push('/post/list')} className="cancel-button">목록</button>
                <button onClick={handleSubmit} className="submit-button">등록</button>
            </div>
        </div>
    );
}