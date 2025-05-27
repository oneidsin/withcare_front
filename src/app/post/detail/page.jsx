'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import './detail.css';

export default function PostDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const postIdx = searchParams.get('post_idx');

    const [post, setPost] = useState(null);

    const boardIdxFromParam = searchParams.get('board_idx');
    const effectiveBoardIdx = boardIdxFromParam || post?.board_idx;

    // 게시글 정보, 작성자 일치
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [photos, setPhotos] = useState([]);
    const [loginId, setLoginId] = useState(null);
    const [lvIdx, setLvIdx] = useState(null); // 작성자 여부로 인해 lv_idx 필요

    // 게시판 이름
    const [boardName, setBoardName] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            const parsed = JSON.parse(atob(token.split('.')[1]));
            setLoginId(parsed.id);

            // lv_idx는 따로 불러오기
            axios.get('http://localhost/member/info', {
                headers: { Authorization: token }
            }).then(res => {
                if (res.data.success) {
                    setLvIdx(res.data.lv_idx);
                } else {
                    console.warn("lv_idx 불러오기 실패");
                }
            }).catch(err => {
                console.error("lv_idx 요청 실패", err);
            });
        }
        fetchPostWithHit();
    }, [postIdx]);

    // 조건 판별
    const isAdmin = lvIdx === 7;
    const isOwner = loginId === post?.id;
    const canEditOrDelete = isAdmin || isOwner;

    // 페이지 처음 로딩용 (조회수 증가)
    const fetchPostWithHit = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost/post/detail/hitup/${postIdx}`, {
                headers: { Authorization: token }
            });
            if (res.data) {
                setPost(res.data.post);
                setLikes(res.data.likes);
                setDislikes(res.data.dislikes);
                setPhotos(res.data.photos);
                fetchBoardName(res.data.post.board_idx);
            }
        } catch (err) {
            alert("게시글 조회 실패");
        }
    };

    // 추천 누르고 상태 업데이트 (조회수 증가 X)
    const fetchPostWithoutHit = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost/post/detail/${postIdx}`, {
                headers: { Authorization: token }
            });
            if (res.data) {
                setPost(res.data.post);
                setLikes(res.data.likes);
                setDislikes(res.data.dislikes);
                setPhotos(res.data.photos);
            }
        } catch (err) {
            console.error("조회 실패", err);
        }
    };

    const fetchBoardName = async (boardIdx) => {
        try {
            const res = await axios.get(`http://localhost/board/${boardIdx}`);
            if (res.data && res.data.board_name) {
                setBoardName(res.data.board_name);
            }
        } catch (err) {
            console.error('게시판 이름 로딩 실패');
        }
    };

    // 삭제
    const handleDelete = async () => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.put('http://localhost/post/delete', {
                post_idx: postIdx
            }, {
                headers: { Authorization: token }
            });

            if (res.data.success) {
                alert("삭제되었습니다.");
                router.push(`/post?board_idx=${post.board_idx}`);
            } else {
                alert("삭제 권한이 없습니다.");
            }
        } catch (err) {
            alert("삭제 중 오류 발생");
        }
    };

    //추천
    const handleRecommend = async (type) => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.post('http://localhost/post/like', {
                post_idx: post.post_idx,
                like_type: type,
            }, {
                headers: { Authorization: token },
            });

            if (res.data.success) {
                fetchPostWithoutHit(); // 여기선 조회수 안 올림
            } else {
                alert('추천 실패');
            }
        } catch (err) {
            alert('요청 실패');
        }
    };

    if (!post) return <div>Loading...</div>;

    const isOwnerOrAdmin = loginId === post.id || loginId === 'admin';

    return (
        <div className="detail-container">
            <div className="detail-header">
                <span className="detail-category">{boardName || '게시판'}</span>
            </div>

            <h2 className="detail-title">{post.post_title}</h2>

            <div className="detail-meta">
                <div className="meta-left">
                    <div className="meta-author-line">
                        {/*<img className="avatar" src="/default-avatar.png" alt="avatar" />*/}  {/*프로필 사진 나오게 해야 함!*/}
                        <span>{post.id}</span>
                        <span className="badge">관리자</span> {/*배지 나오게 해야 함!*/}
                    </div>
                    <div className="meta-date-line">
                        {post.post_create_date.slice(0, 10)} ・ 조회 {post.post_view_cnt}
                    </div>
                </div>
                <div className="detail-controls">
                    {canEditOrDelete ? (
                        <>
                            <button onClick={() => router.push(`/post/update?post_idx=${post.post_idx}`)}>수정</button>
                            <button onClick={handleDelete}>삭제</button>
                        </>
                    ) : (
                        <button className="warn-button">⚠ 신고</button>
                    )}
                </div>
            </div>

            <hr />

            <div className="detail-content">
                {post.post_content.split('\n').map((line, idx) => <p key={idx}>{line}</p>)}
                {photos.map((photo, idx) => (
                    <img key={idx} src={`http://localhost/file/${photo.file_url}`} alt="첨부 이미지" className="attached-image" />
                ))}
            </div>

            <div className="recommend-box">
                <div className="recommend-button" onClick={() => handleRecommend(1)}>
                    <span className="like">👍 추천</span>
                    <span> {likes}</span>
                </div>
                <div className="recommend-button" onClick={() => handleRecommend(-1)}>
                    <span className="dislike">👎 비추천</span>
                    <span> {dislikes}</span>
                </div>
            </div>

            <div className="comment-box">
                <div className="comment-writer">{loginId || 'guest'}</div>
                <input placeholder="댓글을 남겨보세요." className="comment-input" />
                <button className="comment-submit">등록</button>
            </div>

            <div className="detail-footer">
                <button
                    className="list-button"
                    onClick={() => {
                        if (effectiveBoardIdx) {
                            router.push(`/post/?board_idx=${effectiveBoardIdx}`);
                        } else {
                            alert("게시판 정보가 없습니다.");
                        }
                    }}
                >
                    ← 목록
                </button>
            </div>
        </div>
    );
}
