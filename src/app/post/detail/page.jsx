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

    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [photos, setPhotos] = useState([]);
    const [loginId, setLoginId] = useState(null);
    const [lvIdx, setLvIdx] = useState(null);
    const [boardName, setBoardName] = useState('');
    const [userLikeStatus, setUserLikeStatus] = useState(0);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            const parsed = JSON.parse(atob(token.split('.')[1]));
            setLoginId(parsed.id);

            axios.get('http://localhost/member/info', {
                headers: { Authorization: token }
            }).then(res => {
                if (res.data.success) {
                    setLvIdx(res.data.lv_idx);
                }
            }).catch(err => {
                console.error("lv_idx 요청 실패", err);
            });

            fetchUserLikeStatus(postIdx); // ✅ 분리된 상태 조회
        }

        fetchPostWithHit();
    }, [postIdx]);


    const isAdmin = lvIdx === 7;
    const isOwner = loginId === post?.id;
    const canEditOrDelete = isAdmin || isOwner;

    const fetchPostWithHit = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost/post/detail/hitup/${postIdx}`, {
                headers: { Authorization: token }
            });
            if (res.data.success === false) {
                alert(res.data.message || "게시글을 볼 수 있는 권한이 없습니다.");
                router.push(`/post?board_idx=${effectiveBoardIdx}`);
                return;
            }
            if (res.data) {
                setPost(res.data.post);
                setLikes(res.data.likes);
                setDislikes(res.data.dislikes);
                setPhotos(res.data.photos);
                fetchBoardName(res.data.post.board_idx);
            }
        } catch (err) {
            alert("게시글 조회 실패");
            router.push(`/post?board_idx=${effectiveBoardIdx}`);
        }
    };

    const fetchUserLikeStatus = async (postIdx) => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            const res = await axios.get(`http://localhost/post/like/status/${postIdx}`, {
                headers: { Authorization: token }
            });

            if (res.data && res.data.success) {
                setUserLikeStatus(res.data.likeStatus || 0);
            } else {
                setUserLikeStatus(0);
            }
        } catch (err) {
            console.error("추천 상태 조회 실패", err);
            setUserLikeStatus(0);
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

    const handleRecommend = async (type) => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        try {
            const newType = userLikeStatus === type ? 0 : type;
            
            // 즉시 UI 업데이트 (서버 응답 전)
            const prevStatus = userLikeStatus;
            setUserLikeStatus(newType);
            
            // 이전 상태에 따라 카운트 즉시 업데이트
            if (prevStatus === 1) {
                setLikes(prev => prev - 1);
            } else if (prevStatus === -1) {
                setDislikes(prev => prev - 1);
            }
            
            // 새로운 상태에 따라 카운트 즉시 업데이트
            if (newType === 1) {
                setLikes(prev => prev + 1);
            } else if (newType === -1) {
                setDislikes(prev => prev + 1);
            }

            const res = await axios.post('http://localhost/post/like', {
                post_idx: post.post_idx,
                like_type: newType,
            }, {
                headers: { Authorization: token },
            });

            if (!res.data.success) {
                // 실패 시 이전 상태로 복구
                setUserLikeStatus(prevStatus);
                
                // 카운트도 이전 상태로 복구
                if (prevStatus === 1) {
                    setLikes(prev => prev + 1);
                } else if (prevStatus === -1) {
                    setDislikes(prev => prev + 1);
                }
                if (newType === 1) {
                    setLikes(prev => prev - 1);
                } else if (newType === -1) {
                    setDislikes(prev => prev - 1);
                }
                
                alert('추천/비추천 처리 실패');
            }
        } catch (err) {
            console.error('요청 실패:', err);
            alert('요청 처리 중 오류가 발생했습니다.');
            // 에러 시 서버 상태와 동기화
            fetchPostWithHit();
            fetchUserLikeStatus(post.post_idx);
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
                        <span>{post.id || '익명'}</span>
                        <span className="badge">관리자</span>
                    </div>
                    <div className="meta-date-line">
                        {post.post_create_date.slice(0, 10)} · 조회 {post.post_view_cnt}
                    </div>
                </div>
                <div className="detail-controls">
                    {canEditOrDelete ? (
                        <>
                            <button className="detail-button" onClick={() => router.push(`/post/update?post_idx=${post.post_idx}`)}>수정</button>
                            <button className="detail-button" onClick={handleDelete}>삭제</button>
                        </>
                    ) : (
                        <button className="detail-button" className="warn-button">⚠ 신고</button>
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
                <button className={`recommend-button ${userLikeStatus === 1 ? 'active' : ''}`} onClick={() => handleRecommend(1)}>
                    <span className="emoji">👍</span>
                    <span className="like">추천</span>
                    <span>{likes}</span>
                </button>
                <button className={`recommend-button ${userLikeStatus === -1 ? 'active' : ''}`} onClick={() => handleRecommend(-1)}>
                    <span className="emoji">👎</span>
                    <span className="dislike">비추천</span>
                    <span>{dislikes}</span>
                </button>
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