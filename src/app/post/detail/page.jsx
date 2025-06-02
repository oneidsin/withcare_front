'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import './detail.css';

export default function PostDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const postIdx = searchParams.get('post_idx');
    const boardIdxFromParam = searchParams.get('board_idx');

    const [post, setPost] = useState(null);
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [photos, setPhotos] = useState([]);
    const [loginId, setLoginId] = useState(null);
    const [lvIdx, setLvIdx] = useState(null);
    const [boardName, setBoardName] = useState('');
    const [userLikeStatus, setUserLikeStatus] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // COMMENTS
    const [coms, setComs] = useState('');
    const [comList, setComList] = useState([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const effectiveBoardIdx = boardIdxFromParam || post?.board_idx;
    const comIdx = searchParams.get('com_idx');

    // COMMENT LIST
    const fetchCom = async () => {
        const res = await axios.get(`http://localhost/post/detail/${postIdx}/list`);
        console.log('댓글 응답 : ',res.data);
        if (res.data.list) {
            setComList(res.data.list || []);
        };
    }

    // 전체 사용자 목록 가져오기
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const response = await axios.get('http://localhost/post/detail/users', {
                    headers: { Authorization: token }
                });
                
                if (response.data && response.data.list) {
                    console.log('받아온 사용자 목록:', response.data.list);
                    setAllUsers(response.data.list);
                }
            } catch (error) {
                console.error('사용자 목록 가져오기 실패:', error);
            }
        };
        fetchAllUsers();
    }, []);

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
        }
    }, []);  // 로그인 정보는 최초 마운트시에만 가져옴

    useEffect(() => {
        if (postIdx) {
            fetchPostWithHit().then(() => {
                fetchCom(); // 게시글 데이터 이후 댓글 호출
            });
        }
    }, [postIdx]);

    // 좋아요 상태를 가져오는 useEffect를 분리하고 loginId 의존성 추가
    useEffect(() => {
        if (postIdx && loginId) {
            fetchUserLikeStatus(postIdx);
        } else {
            setUserLikeStatus(0); // 로그인하지 않은 경우 초기화
        }
    }, [postIdx, loginId]);  // postIdx나 loginId가 변경될 때마다 실행

    const isAdmin = lvIdx === 7;
    const isOwner = loginId === post?.id;
    const canEditOrDelete = isAdmin || isOwner;

    const fetchPostWithHit = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost/post/detail/hitup/${postIdx}`, {
                headers: { Authorization: token }
            });

            // 응답 데이터 로깅 (디버깅용)
            console.log('Response:', res.data);

            if (!res.data.success) {
                // 권한이 없을 때 알림 표시 후 리다이렉트
                const message = res.data.message || "게시글을 볼 수 있는 권한이 없습니다.";
                window.alert(message); // window.alert로 변경하여 확실히 표시되도록 함
                
                setTimeout(() => {
                    if (boardIdxFromParam) {
                        router.push(`/post?board_idx=${boardIdxFromParam}`);
                    } else {
                        router.push('/post');
                    }
                }, 100); // 알림이 확실히 표시된 후 리다이렉트
                return;
            }

            if (res.data.post) {
                setPost(res.data.post);
                setLikes(res.data.likes);
                setDislikes(res.data.dislikes);
                setPhotos(res.data.photos);
                fetchBoardName(res.data.post.board_idx);
            } else {
                window.alert("게시글을 찾을 수 없습니다.");
                setTimeout(() => {
                    if (boardIdxFromParam) {
                        router.push(`/post?board_idx=${boardIdxFromParam}`);
                    } else {
                        router.push('/post');
                    }
                }, 100);
            }
        } catch (err) {
            console.error("Error:", err);
            window.alert("게시글 조회 실패");
            setTimeout(() => {
                if (boardIdxFromParam) {
                    router.push(`/post?board_idx=${boardIdxFromParam}`);
                } else {
                    router.push('/post');
                }
            }, 100);
        }
    };

    const fetchUserLikeStatus = async (postIdx) => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setUserLikeStatus(0);
            return;
        }

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

        if (isProcessing) {
            return;
        }

        setIsProcessing(true);

        try {
            // 현재 상태 저장
            const prevStatus = userLikeStatus;
            const newType = prevStatus === type ? 0 : type;

            // 즉시 UI 업데이트
            setUserLikeStatus(newType);
            if (prevStatus === 1) setLikes(prev => prev - 1);
            if (prevStatus === -1) setDislikes(prev => prev - 1);
            if (newType === 1) setLikes(prev => prev + 1);
            if (newType === -1) setDislikes(prev => prev + 1);

            const res = await axios.post('http://localhost/post/like', {
                post_idx: post.post_idx,
                like_type: type,
            }, {
                headers: { Authorization: token },
            });

            if (!res.data.success) {
                // 실패 시 이전 상태로 복구
                setUserLikeStatus(prevStatus);
                if (prevStatus === 1) setLikes(prev => prev + 1);
                if (prevStatus === -1) setDislikes(prev => prev + 1);
                if (newType === 1) setLikes(prev => prev - 1);
                if (newType === -1) setDislikes(prev => prev - 1);
                alert('추천/비추천 처리 실패');
            }
        } catch (err) {
            console.error('요청 실패:', err);
            alert('요청 처리 중 오류가 발생했습니다.');
            // 서버와 상태 동기화
            await fetchPostWithHit();
            await fetchUserLikeStatus(post.post_idx);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!postIdx) {
        if (boardIdxFromParam) {
            router.push(`/post?board_idx=${boardIdxFromParam}`);
        } else {
            router.push('/post');
        }
        return null;
    }

    // Loading 상태일 때 리스트로 리다이렉트
    if (!post) {
        return <div className="detail-container">로딩 중...</div>;
    }

    const isOwnerOrAdmin = loginId === post.id || loginId === 'admin';

    // WRITE COMMENTS
    const handleCom = async () => {
        if (!coms) return alert('댓글 내용을 입력하세요.');

        // 멘션 처리: @로 시작하는 단어들을 찾아서 멘션으로 처리
        const mentions = coms.match(/@[\w]+/g) || [];
        const mentionIds = mentions.map(mention => mention.slice(1)); // @ 제거

        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        const comRes = await axios.post(`http://localhost/post/detail/${postIdx}/write`, {
            post_idx:postIdx,
            com_idx: comIdx,
            com_content: coms,
            com_blind_yn: false,
            mentions: mentionIds // 멘션된 사용자 ID 목록 추가
        }, {
            headers: { Authorization: token },
        });

        if(!comRes.data.success) return alert('댓글 등록 실패');

        alert('댓글이 등록 되었습니다.');
        //window.location.href = `/post/detail?post_idx=${postIdx}`;
        setComs(''); // 입력창 초기화
        fetchCom(); // 댓글 리스트 다시 불러오기
    }

    // 사용자 검색 함수
    const searchUsers = (query) => {
        if (!query.trim()) {
            setMentionSuggestions([]);
            return;
        }
        
        console.log('검색 쿼리:', query);
        console.log('현재 전체 사용자 목록:', allUsers);
        
        // 로컬에서 필터링
        const filteredUsers = allUsers
            .filter(userId => {
                const match = userId.toLowerCase().includes(query.toLowerCase());
                console.log(`사용자 ${userId} 매칭 결과:`, match);
                return match;
            })
            .slice(0, 5);

        console.log('필터링된 사용자:', filteredUsers);
        setMentionSuggestions(filteredUsers.map(id => ({ id })));
    };

    // 멘션 선택 처리
    const handleMentionSelect = (userId) => {
        const textBeforeMention = coms.slice(0, coms.lastIndexOf('@'));
        const newText = `${textBeforeMention}@${userId} `;
        setComs(newText);
        setShowMentionSuggestions(false);
        setMentionSuggestions([]);
        setMentionQuery('');
    };

    // 댓글 입력 처리
    const handleCommentInput = (e) => {
        const text = e.target.value;
        setComs(text);

        // @ 입력 감지 및 멘션 제안 표시
        const lastAtSymbol = text.lastIndexOf('@');
        if (lastAtSymbol !== -1 && !text.slice(lastAtSymbol).includes(' ')) {
            const query = text.slice(lastAtSymbol + 1);
            setMentionQuery(query);
            setShowMentionSuggestions(true);
            searchUsers(query);
        } else {
            setShowMentionSuggestions(false);
            setMentionSuggestions([]);
            setMentionQuery('');
        }
    };

    const comDelete = async (comIdx) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        const token = sessionStorage.getItem('token');
        const res = await axios.put(`http://localhost/post/detail/${postIdx}/delete`, {
                com_idx: comIdx,
                com_blind_yn: true  // 블라인드 처리를 위한 값 추가
            }, {
                headers: { Authorization: token }
            });

            if (res.data.success) {
                alert("삭제되었습니다.");
                fetchCom(); // 삭제 성공 시 목록 새로고침
            } else {
                alert("삭제 권한이 없습니다.");
            }
    };

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
                            <button className="detail-control-button" onClick={() => router.push(`/post/update?post_idx=${post.post_idx}`)}>수정</button>
                            <button className="detail-control-button" onClick={handleDelete}>삭제</button>
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
                <button 
                    className={`recommend-button ${userLikeStatus === 1 ? 'active' : ''}`} 
                    onClick={() => handleRecommend(1)}
                    disabled={isProcessing}
                >
                    <span className="emoji">👍</span>
                    <span className="like">추천</span>
                    <span>{likes}</span>
                </button>
                <button 
                    className={`recommend-button ${userLikeStatus === -1 ? 'active' : ''}`} 
                    onClick={() => handleRecommend(-1)}
                    disabled={isProcessing}
                >
                    <span className="emoji">👎</span>
                    <span className="dislike">비추천</span>
                    <span>{dislikes}</span>
                </button>
            </div>

            {console.log("댓글 리스트", comList)}

            <div className="comment-list">
                {comList.length === 0 ? (
                    <p>댓글이 없습니다.</p>
                ) : (
                    comList.map((comment, idx) => (
                        <div key={idx} className="comment-item">
                            <div className="comment-header">
                                <span className="comlist-writer">{comment.id}</span>
                                <span className="comment-date">{comment.com_create_date?.slice(0, 10)}</span>
                                <button className="comlist-btn"> 수정 </button>
                                <button className="comlist-btn" onClick={() => comDelete(comment.com_idx)}> 삭제 </button>
                                <button className="comlist-btn"> 신고 </button>
                            </div>
                            <div className="comment-content">{comment.com_content}</div>
                        </div>
                    ))
                )}
            </div>


            <div className="comment-box">
                <div className="comment-writer">{loginId || 'guest'}</div>
                <div className="comment-input-container">
                    <input 
                        placeholder="댓글을 남겨보세요. (@를 입력하여 멘션)" 
                        className="comment-input" 
                        value={coms} 
                        onChange={handleCommentInput}
                    />
                    {showMentionSuggestions && (
                        <div className="mention-suggestions">
                            {mentionSuggestions.length > 0 ? (
                                mentionSuggestions.map((user, index) => (
                                    <div 
                                        key={index} 
                                        className="mention-item"
                                        onClick={() => handleMentionSelect(user.id)}
                                    >
                                        @{user.id}
                                    </div>
                                ))
                            ) : (
                                <div className="mention-hint">
                                    {mentionQuery ? "일치하는 사용자가 없습니다" : "@를 입력하여 사용자를 멘션할 수 있습니다"}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="submit">
                <button className="submit-button" onClick={handleCom}>등록</button>
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