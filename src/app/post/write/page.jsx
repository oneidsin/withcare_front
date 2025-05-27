'use client';

import {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import '../update/update.css';
import {fetchVisibleBoards} from "@/app/post/boardList";

export default function PostWritePage() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [board, setBoard] = useState('');
    const [allowComment, setAllowComment] = useState(true);

    const [newFiles, setNewFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    const [boards, setBoards] = useState([]);
    useEffect(() => {
        fetchVisibleBoards().then(setBoards);
    }, []);

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
        const postRes = await axios.post('http://localhost/post/write', {
            post_title: title,
            post_content: content,
            board_idx: parseInt(board),
            allow_comment: allowComment,
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
                <input type="text" value="admin" readOnly />
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
                <select value={board} onChange={(e) => setBoard(e.target.value)}>
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