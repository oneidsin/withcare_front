'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import './detail.css';

function PostDetailContent() {
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
    const [isAnonymousBoard, setIsAnonymousBoard] = useState(false);
    const [userLikeStatus, setUserLikeStatus] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // COMMENTS
    const [coms, setComs] = useState(''); // 댓글 내용쿤
    const [comList, setComList] = useState([]); // 댓글 리스트쿤
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false); // 멘션 유저리스트 추천쿤
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [userIcons, setUserIcons] = useState({}); // 사용자별 아이콘 정보 저장
    const effectiveBoardIdx = boardIdxFromParam || post?.board_idx;
    const comIdx = searchParams.get('com_idx');
    const [updateComIdx, setUpdateComIdx] = useState(null); // 수정 중인 댓글의 인덱스
    const [updateComs, setUpdateComs] = useState(""); // 수정할 댓글 내용

    // COMMENT LIST
    const fetchCom = async () => {
        const res = await axios.get(`http://localhost/post/detail/${postIdx}/list`);
        console.log('댓글 응답 : ', res.data);
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
                console.log('게시글 데이터:', res.data.post);  // 디버깅용 로그 추가
                console.log('댓글 허용 여부:', res.data.post.com_yn);  // 디버깅용 로그 추가
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
                setIsAnonymousBoard(res.data.anony_yn === true);
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
        // 댓글 허용 여부 체크
        if (!post.com_yn) {
            alert('댓글이 허용되지 않은 게시글입니다.');
            return;
        }

        if (!coms) return alert('댓글 내용을 입력하세요.');

        // 멘션 처리: @로 시작하는 단어들을 찾아서 멘션으로 처리
        const mentions = coms.match(/@[\w]+/g) || [];
        const mentionIds = mentions.map(mention => mention.slice(1)); // @ 제거

        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const comRes = await axios.post(`http://localhost/post/detail/${postIdx}/write`, {
                post_idx: postIdx,
                com_idx: comIdx,
                com_content: coms,
                com_blind_yn: false,
                mentions: mentionIds, // 멘션된 사용자 ID 목록 추가
                id: isAnonymousBoard ? '익명' : loginId // 익명 게시판일 경우 '익명'으로 설정
            }, {
                headers: { Authorization: token },
            });

            if (!comRes.data.success) {
                alert(comRes.data.message || '댓글 등록 실패');
                return;
            }

            alert('댓글이 등록 되었습니다.');
            setComs(''); // 입력창 초기화
            fetchCom(); // 댓글 리스트 다시 불러오기
        } catch (error) {
            console.error('댓글 등록 중 오류:', error);
            alert('댓글 등록 중 오류가 발생했습니다.');
        }
    };

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

    // '수정' 버튼 눌렀을 때 실행됨
    // 클릭한 댓글의 com_idx를 상태에 저장해서 어떤 댓글을 수정하는지 표시하고,
    // 댓글 내용을 수정용 상태 변수에 넣어서 input에 보여주게 함
    const handleEditClick = (comment) => {
        setUpdateComIdx(comment.com_idx);       // 수정할 댓글 ID 저장
        setUpdateComs(comment.com_content);     // 수정할 댓글 내용 저장
    };

    // '취소' 버튼 눌렀을 때 실행됨
    // 수정 모드를 종료하고, 수정용 상태 변수 초기화
    const handleEditCancel = () => {
        setUpdateComIdx(null);   // 수정 중인 댓글 ID 초기화 (수정 종료)
        setUpdateComs("");       // 수정 중인 댓글 내용 초기화
    };

    // '완료' 버튼 눌렀을 때 실행됨
    // 실제로 서버에 수정 내용을 보내는 작업 넣어야 함
    // 지금은 콘솔에 수정된 댓글 내용 찍고 수정 모드 종료
    const handleEditSubmit = async () => {
        if (updateComs.trim() === "") {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        const token = sessionStorage.getItem('token');
        const response = await axios.put(`http://localhost/post/detail/${postIdx}/update`, {
            com_idx: updateComIdx,
            com_content: updateComs,
            id: isAnonymousBoard ? '익명' : loginId // 익명 게시판일 경우 수정된 댓글도 익명으로 처리
        }, { headers: { Authorization: token } });

        if (response.data.success) {
            alert('댓글 수정이 완료 되었습니다.');
            setUpdateComIdx(null);  // 수정 모드 종료
            setUpdateComs("");      // 수정 상태 초기화
            fetchCom(); // 수정 성공 시 목록 새로고침
        } else {
            alert('댓글을 수정할 권한이 없습니다.');
        }
    };


    // 댓글 삭제
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

    // 신고 페이지로 이동(게시글)
    const moveToReportPost = () => {
        const reportUrl = `/report?item_idx=${postIdx}&item_type=게시글`;
        window.open(reportUrl, '_blank');
    }

    // 신고 페이지로 이동(댓글, 멘션)
    const moveToReportCom = (comIdx, comContent) => {
        const type = comContent.trim().startsWith('@') ? '멘션' : '댓글';
        const reportUrl = `/report?item_idx=${comIdx}&item_type=${type}`;
        window.open(reportUrl, '_blank');
    }

    // 사용자 아이콘 정보 가져오기
    const fetchUserIcons = async (userId) => {
        if (userIcons[userId] || !userId || userId === '익명') {
            return userIcons[userId] || null;
        }

        try {
            console.log(`🔍 사용자 ${userId} 아이콘 정보 요청 중...`);
            const response = await axios.get(`http://localhost/profile/public/${userId}`);

            console.log(`📋 ${userId} API 응답:`, response.data);

            if (response.data?.status === "success") {
                const profile = response.data.profile;
                const levelInfo = response.data.levelInfo;
                const mainBadge = response.data.mainBadge;

                console.log(`📊 ${userId} 레벨 정보:`, levelInfo);
                console.log(`🏆 ${userId} 배지 정보:`, mainBadge);

                let levelIconUrl = null;
                let levelName = '새싹';

                // 레벨 정보가 없거나 아이콘이 없는 경우 별도로 레벨 목록에서 찾기
                if (levelInfo?.lv_idx) {
                    try {
                        const token = sessionStorage.getItem('token');
                        const levelRes = await axios.get("http://localhost:80/admin/level", {
                            headers: { Authorization: token }
                        });

                        const levels = Array.isArray(levelRes.data) ? levelRes.data : levelRes.data.result || [];
                        const userLevel = levels.find(level => Number(level.lv_idx) === Number(levelInfo.lv_idx));

                        if (userLevel) {
                            levelIconUrl = userLevel.lv_icon;
                            levelName = userLevel.lv_name;
                            console.log(`🎯 레벨 목록에서 찾은 레벨:`, userLevel);
                        }
                    } catch (levelError) {
                        console.log(`⚠️ 레벨 목록 조회 실패, 기본 레벨 정보 사용`);
                        // 기본 정보 사용
                        if (levelInfo?.lv_icon) {
                            levelIconUrl = levelInfo.lv_icon.startsWith('http') ? levelInfo.lv_icon : `http://localhost:80/file/${levelInfo.lv_icon}`;
                        }
                        levelName = levelInfo?.lv_name || '새싹';
                    }
                }

                // 배지 아이콘 URL 처리
                let badgeIconUrl = null;
                if (mainBadge?.bdg_icon) {
                    if (mainBadge.bdg_icon.startsWith('http')) {
                        badgeIconUrl = mainBadge.bdg_icon;
                    } else {
                        badgeIconUrl = `http://localhost:80/file/${mainBadge.bdg_icon}`;
                    }
                }

                const iconData = {
                    levelIcon: levelIconUrl,
                    levelName: levelName,
                    badgeIcon: badgeIconUrl,
                    badgeName: mainBadge?.bdg_name || null
                };

                console.log(`✅ ${userId} 최종 아이콘 데이터:`, iconData);

                setUserIcons(prev => ({
                    ...prev,
                    [userId]: iconData
                }));

                return iconData;
            }
        } catch (error) {
            console.error(`❌ 사용자 ${userId} 아이콘 정보 로딩 실패:`, error);
        }

        return null;
    };

    // 사용자 아이콘 렌더링 컴포넌트
    const UserIcons = ({ userId }) => {
        const [icons, setIcons] = useState(null);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            if (userId && userId !== '익명' && !isAnonymousBoard) {
                setLoading(true);
                fetchUserIcons(userId).then((data) => {
                    console.log(`🎨 ${userId} 아이콘 렌더링:`, data);
                    setIcons(data);
                    setLoading(false);
                });
            }
        }, [userId]);

        if (isAnonymousBoard || !userId || userId === '익명') return null;
        if (loading) return <span className="icon-loading">⏳</span>;
        if (!icons) return null;

        return (
            <div className="user-icons">
                {icons.levelIcon && (
                    <img
                        src={icons.levelIcon}
                        alt={icons.levelName}
                        className="level-icon-small"
                        title={`레벨: ${icons.levelName}`}
                        onError={(e) => {
                            console.error(`❌ 레벨 아이콘 로드 실패:`, icons.levelIcon);
                            e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                            console.log(`✅ 레벨 아이콘 로드 성공:`, icons.levelIcon);
                        }}
                    />
                )}
                {icons.badgeIcon && (
                    <img
                        src={icons.badgeIcon}
                        alt={icons.badgeName}
                        className="badge-icon-small"
                        title={`배지: ${icons.badgeName}`}
                        onError={(e) => {
                            console.error(`❌ 배지 아이콘 로드 실패:`, icons.badgeIcon);
                            e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                            console.log(`✅ 배지 아이콘 로드 성공:`, icons.badgeIcon);
                        }}
                    />
                )}
            </div>
        );
    };

    // 멘션 파싱 및 렌더링 함수
    const renderCommentWithMentions = (content) => {
        if (!content) return '';

        // @로 시작하는 멘션을 찾는 정규식 (공백이나 문장 끝까지)
        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            // 멘션 이전 텍스트 추가
            if (match.index > lastIndex) {
                parts.push(content.slice(lastIndex, match.index));
            }

            // 멘션 부분을 클릭 가능한 span으로 추가
            const mentionedUserId = match[1];
            parts.push(
                <span
                    key={`mention-${match.index}-${mentionedUserId}`}
                    className="mention-link"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isAnonymousBoard) {
                            router.push(`/profile/view/${mentionedUserId}`);
                        }
                    }}
                >
                    @{mentionedUserId}
                </span>
            );

            lastIndex = match.index + match[0].length;
        }

        // 남은 텍스트 추가
        if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };


    // 날짜를 한국 형식으로 포맷팅하는 함수
    const formatDate = (dateString) => {
        if (!dateString) return '-'; // 날짜 문자열이 없으면 '-' 반환

        const date = new Date(dateString); // 날짜 객체 생성
        // 날짜 부분을 한국어 형식으로 변환하고 공백 제거
        const datePart = date.toLocaleDateString('ko-KR').replace(/ /g, '');
        // 시간 부분을 24시간 형식으로 변환
        const timePart = date.toLocaleTimeString('ko-KR', {
            hour: '2-digit', // 시간: 두 자리 숫자
            minute: '2-digit', // 분: 두 자리 숫자
            hour12: false // 24시간 형식 사용
        });

        return `${datePart} ${timePart}`; // 날짜와 시간 조합하여 반환
    };


    return (
        <div className="detail-container">
            <div className="detail-header">
                <span
                    className="detail-category"
                    style={{
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#f0f8ff',
                        color: '#007bff',
                        fontWeight: 'bold',
                        transition: 'all 0.3s',
                        display: 'inline-block'
                    }}
                    onClick={() => {
                        if (effectiveBoardIdx) {
                            router.push(`/post/?board_idx=${effectiveBoardIdx}`);
                        }
                    }}
                >
                    {boardName || '게시판'}
                </span>
            </div>

            <h2 className="detail-title">{post.post_title}</h2>

            <div className="detail-meta">
                <div className="meta-left">
                    <div className="meta-author-line">
                        {isAnonymousBoard || !post.id || post.id === '익명' ? (
                            <span>익명</span>
                        ) : (
                            <div className="author-with-icons">
                                <span
                                    className="clickable-author"
                                    onClick={() => router.push(`/profile/view/${post.id}`)}
                                >
                                    {post.id}
                                </span>
                                <UserIcons userId={post.id} />
                            </div>
                        )}
                    </div>
                    <div className="meta-date-line">
                        {post.post_create_date.slice(0, 10)} · 조회 {post.post_view_cnt}
                    </div>
                </div>
                <div className="detail-controls">
                    {canEditOrDelete && (
                        <>
                            <button className="detail-control-button" onClick={() => router.push(`/post/update?post_idx=${post.post_idx}`)}>수정</button>
                            <button className="detail-control-button" onClick={handleDelete}>삭제</button>
                        </>
                    )}
                    {!isOwnerOrAdmin && (
                        <button className="warn-button" onClick={() => moveToReportPost()}>⚠ 신고</button>
                    )}
                </div>
            </div>

            <hr />

            <div className="detail-content">
                {post.post_content.split('\n').map((line, idx) => <p key={idx}>{line}</p>)}
                {photos.map((photo, idx) => {
                    // 이미지 URL이 이미 http:// 또는 https://로 시작하는지 확인
                    const imgSrc = photo.file_url.startsWith('http://') || photo.file_url.startsWith('https://')
                        ? photo.file_url  // 이미 전체 URL이면 그대로 사용
                        : `http://localhost/file/${photo.file_url}`;  // 아니면 경로 추가

                    return (
                        <img
                            key={idx}
                            src={imgSrc}
                            alt="첨부 이미지"
                            className="attached-image"
                            onError={(e) => {
                                console.error("이미지 로드 실패:", imgSrc);
                                e.target.style.display = 'none'; // 이미지 로드 실패 시 숨김 처리
                            }}
                        />
                    );
                })}
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

            {/* 댓글 섹션 */}
            {post.com_yn ? (
                <>
                    <div className="comment-list">
                        {comList.length === 0 ? (
                            <p>댓글이 없습니다.</p>
                        ) : (
                            comList.map((comment, idx) => (
                                <div key={idx} className="comment-item">
                                    <div className="comment-header">
                                        {isAnonymousBoard || !comment.id || comment.id === '익명' ? (
                                            <span className="comlist-writer">익명</span>
                                        ) : (
                                            <div className="comment-author-with-icons">
                                                <span
                                                    className="comlist-writer clickable-author"
                                                    onClick={() => router.push(`/profile/view/${comment.id}`)}
                                                >
                                                    {comment.id}
                                                </span>
                                                <UserIcons userId={comment.id} />
                                            </div>
                                        )}
                                        <div className="comment-buttons">
                                            {updateComIdx === comment.com_idx ? (
                                                <>
                                                    <button className="comlist-btn" onClick={handleEditSubmit}>완료</button>
                                                    <button className="comlist-btn" onClick={handleEditCancel}>취소</button>
                                                </>
                                            ) : (
                                                <>
                                                    {(loginId === comment.id) && (
                                                        <button className="comlist-btn" onClick={() => handleEditClick(comment)}>수정</button>
                                                    )}
                                                    {(loginId === comment.id || isAdmin) && (
                                                        <button className="comlist-btn" onClick={() => comDelete(comment.com_idx)}>삭제</button>
                                                    )}
                                                    <button className="comlist-btn" onClick={() => moveToReportCom(comment.com_idx, comment.com_content)}>신고</button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {updateComIdx === comment.com_idx ? (
                                        <input
                                            className="comment-edit-input"
                                            value={updateComs}
                                            onChange={(e) => setUpdateComs(e.target.value)}
                                        />
                                    ) : (
                                        <div className="comment-content">
                                            {renderCommentWithMentions(comment.com_content)}
                                        </div>
                                    )}
                                    <span className="comment-date"> {formatDate(comment.com_update_date || comment.com_create_date)}
                                        {(comment.com_update_date && comment.com_update_date !== comment.com_create_date) && (
                                            <span className="edited-label"> (수정됨)</span>
                                        )} </span>

                                </div>
                            ))
                        )}
                    </div>

                    <div className="comment-box">
                        <div className="comment-writer">{isAnonymousBoard ? '익명' : (loginId || 'guest')}</div>
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
                </>
            ) : (
                <div className="comment-disabled-message" style={{
                    textAlign: 'center',
                    padding: '20px',
                    margin: '20px 0',
                    color: '#666',
                    backgroundColor: '#f8f8f8',
                    border: '1px solid #eee',
                    borderRadius: '4px'
                }}>
                    댓글이 허용되지 않은 게시글입니다.
                </div>
            )}

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

// 메인 컴포넌트 - Suspense로 래핑
export default function PostDetailPage() {
    return (
        <Suspense fallback={<div>로딩 중...</div>}>
            <PostDetailContent />
        </Suspense>
    );
}