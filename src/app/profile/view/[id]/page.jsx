"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { UserWithIcons } from '@/components/UserIcons';
import "./profile.css";

export default function ViewProfilePage() {
    const router = useRouter();
    const params = useParams();
    const targetUserId = params.id;
    
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState("posts");
    const [activities, setActivities] = useState({
        posts: [],
        comments: [],
        likes: [],
        searches: []
    });
    const [cancerList, setCancerList] = useState([]);
    const [stageList, setStageList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const currentUserId = sessionStorage.getItem("id");

        if (!token || !currentUserId) {
            alert("로그인이 필요합니다.");
            router.push("/login");
            return;
        }

        // 시스템 경로 차단 (Next.js 시스템 경로만)
        const blockedIds = ['_next', 'public', 'static', 'assets', 'favicon.ico'];
        if (targetUserId && blockedIds.includes(targetUserId.toLowerCase())) {
            alert("잘못된 접근입니다.");
            router.push("/");
            return;
        }

        // 타인 프로필 데이터 가져오기 (본인 포함 모든 사용자)
        fetchUserProfile();
    }, [targetUserId]);

    // 타인 프로필 데이터 가져오기
    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem("token");
            
            console.log("타겟 사용자 ID:", targetUserId);
            
            // 암 종류와 병기 데이터 가져오기
            const [cancerRes, stageRes] = await Promise.all([
                axios.get("http://localhost/cancer").catch(() => ({ data: [] })),
                axios.get("http://localhost/stage").catch(() => ({ data: [] }))
            ]);
            
            setCancerList(cancerRes.data || []);
            setStageList(stageRes.data || []);

            // 타인 프로필 정보 요청 (먼저 전용 API 시도)
            let profileRes;
            try {
                console.log("전용 view API 시도:", `/profile/view/${targetUserId}`);
                profileRes = await axios.get(`http://localhost/profile/view/${targetUserId}`, {
                    headers: { Authorization: token }
                });
                console.log("view API 응답:", profileRes.data);
            } catch (error) {
                console.log("view API 실패:", error.response?.status, error.response?.data);
                
                // 404 또는 403 에러는 차단/탈퇴 사용자일 가능성
                if (error.response?.status === 404) {
                    alert("존재하지 않는 사용자입니다.");
                    router.push("/main");
                    return;
                }
                
                if (error.response?.status === 403) {
                    alert("접근 권한이 없습니다.");
                    router.push("/main");
                    return;
                }
                
                console.log("기본 프로필 API 시도:", `/profile/${targetUserId}`);
                try {
                    profileRes = await axios.get(`http://localhost/profile/${targetUserId}`, {
                        headers: { Authorization: token }
                    });
                    console.log("기본 API 응답:", profileRes.data);
                } catch (error2) {
                    console.log("기본 API도 실패:", error2.response?.status);
                    
                    // 기본 API도 실패하면 차단된 사용자로 간주
                    if (error2.response?.status === 404) {
                        alert("존재하지 않는 사용자입니다.");
                    } else if (error2.response?.status === 403) {
                        alert("접근 권한이 없습니다.");
                    } else {
                        alert("접근할 수 없는 사용자입니다.");
                    }
                    router.push("/main");
                    return;
                }
            }

            // 응답 데이터 안전하게 처리
            let userData = null;
            if (profileRes.data) {
                if (profileRes.data.status === "success" && profileRes.data.profile) {
                    // API 응답에서 profile 객체 사용
                    userData = profileRes.data.profile;
                    console.log("profile 객체에서 데이터 추출:", userData);
                } else if (profileRes.data.status === "success" && profileRes.data.data) {
                    userData = profileRes.data.data;
                    console.log("data 객체에서 데이터 추출:", userData);
                } else if (profileRes.data.data) {
                    userData = profileRes.data.data;
                    console.log("직접 data 객체 사용:", userData);
                } else if (typeof profileRes.data === 'object' && !profileRes.data.status) {
                    // 직접 프로필 데이터가 반환된 경우
                    userData = profileRes.data;
                    console.log("직접 프로필 데이터 사용:", userData);
                }
            }

            console.log("처리된 사용자 데이터:", userData);

            if (userData) {
                // 백엔드에서 차단/탈퇴 필드 확인
                console.log("사용자 데이터에서 block_yn 존재 여부:", 'block_yn' in userData);
                console.log("사용자 데이터에서 user_del_yn 존재 여부:", 'user_del_yn' in userData);
                
                // block_yn, user_del_yn 필드가 없는 경우 별도 API로 확인
                if (!('block_yn' in userData) || !('user_del_yn' in userData)) {
                    console.warn("⚠️ 프로필 API에서 차단/탈퇴 상태를 제공하지 않음");
                    console.log("📝 차단/탈퇴 상태 필드가 없어도 프로필 조회는 허용합니다.");
                    // 프로필 API가 성공적으로 응답했다면 접근 가능한 사용자로 간주
                }
                
                // 백엔드에서 멤버 테이블 정보가 없는 경우 (차단/탈퇴 가능성)
                // 멤버 정보가 필요한 필드들이 모두 없거나 비정상적인 경우 차단
                if (!userData.id && !userData.name) {
                    console.warn("사용자 기본 정보 부족, 접근 차단");
                    alert("접근할 수 없는 사용자입니다.");
                    router.push("/main");
                    return;
                }
                // 암 종류와 병기 이름 변환 (안전하게 처리)
                let cancerName = "정보 없음";
                let stageName = "정보 없음";
                
                if (userData.cancer_idx && userData.cancer_idx !== 0 && cancerRes.data && cancerRes.data.length > 0) {
                    const foundCancer = cancerRes.data.find(cancer => cancer.cancer_idx === userData.cancer_idx);
                    if (foundCancer) cancerName = foundCancer.cancer_name;
                }
                
                if (userData.stage_idx && userData.stage_idx !== 0 && stageRes.data && stageRes.data.length > 0) {
                    const foundStage = stageRes.data.find(stage => stage.stage_idx === userData.stage_idx);
                    if (foundStage) stageName = foundStage.stage_name;
                }

                const userInfo = {
                    id: targetUserId,
                    name: userData.name || userData.id || targetUserId,
                    email: userData.email || "정보 없음",
                    year: userData.year || null,
                    gender: userData.gender || null,
                    cancer: cancerName,
                    stage: stageName,
                    intro: userData.intro || "",
                    profile_photo: userData.profile_photo || null,
                    profile_yn: userData.profile_yn || false
                };

                console.log("최종 사용자 정보:", userInfo);
                
                // 차단/탈퇴 사용자 체크
                if (userData.block_yn === true || userData.block_yn === 1) {
                    alert("차단된 사용자의 프로필은 조회할 수 없습니다.");
                    router.push("/main");
                    return;
                }
                
                if (userData.user_del_yn === true || userData.user_del_yn === 1) {
                    alert("탈퇴한 사용자의 프로필은 조회할 수 없습니다.");
                    router.push("/main");
                    return;
                }

                // profile_yn 체크 - 비공개 프로필인 경우 타인 접근 차단
                const currentUserId = sessionStorage.getItem("id");
                if (!userInfo.profile_yn && currentUserId !== targetUserId) {
                    alert("이 사용자는 프로필을 비공개로 설정했습니다.");
                    router.back(); // 이전 페이지로 돌아가기
                    return;
                }
                
                setUser(userInfo);
                
                // 활동 내역은 API 응답에서 직접 가져오기
                if (profileRes.data.posts !== undefined) {
                    console.log("프로필 API에서 받은 searches 데이터:", profileRes.data.searches);
                    
                    // searches 데이터 구조 확인
                    if (profileRes.data.searches && profileRes.data.searches.length > 0) {
                        console.log("첫 번째 search 아이템:", profileRes.data.searches[0]);
                        
                        // searches 데이터가 올바른 형식인지 확인
                        const firstSearch = profileRes.data.searches[0];
                        const hasValidFormat = firstSearch && (
                            firstSearch.search_keyword || 
                            firstSearch.sch_keyword || 
                            firstSearch.keyword
                        );
                        
                        if (!hasValidFormat) {
                            console.log("searches 데이터 형식이 올바르지 않음, 별도 API 호출 필요");
                            // 데이터 형식이 맞지 않으면 별도로 가져오기
                            setActivities({
                                posts: profileRes.data.posts || [],
                                comments: profileRes.data.comments || [],
                                likes: profileRes.data.likes || [],
                                searches: [] // 일단 빈 배열로 설정
                            });
                            await fetchSearchHistory(targetUserId);
                        } else {
                            // 올바른 형식이면 그대로 사용
                            setActivities({
                                posts: profileRes.data.posts || [],
                                comments: profileRes.data.comments || [],
                                likes: profileRes.data.likes || [],
                                searches: profileRes.data.searches || []
                            });
                        }
                    } else {
                        // searches가 없으면 별도로 가져오기
                        setActivities({
                            posts: profileRes.data.posts || [],
                            comments: profileRes.data.comments || [],
                            likes: profileRes.data.likes || [],
                            searches: []
                        });
                        await fetchSearchHistory(targetUserId);
                    }
                    
                    console.log("활동 내역 설정 완료:", {
                        posts: profileRes.data.posts?.length || 0,
                        comments: profileRes.data.comments?.length || 0,
                        likes: profileRes.data.likes?.length || 0,
                        searches: profileRes.data.searches?.length || 0
                    });
                } else {
                    // 별도 API 호출
                    await fetchActivities(targetUserId);
                    await fetchSearchHistory(targetUserId);
                }
            } else {
                console.error("사용자 데이터를 찾을 수 없음");
                setError("사용자 정보를 찾을 수 없습니다.");
            }
        } catch (error) {
            console.error("프로필 로딩 실패:", error);
            
            if (error.response?.status === 401) {
                alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                sessionStorage.clear();
                router.push("/login");
                return;
            }
            
            if (error.response?.status === 404) {
                setError("존재하지 않는 사용자입니다.");
            } else {
                setError(`프로필 정보를 불러오는데 실패했습니다: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // 개별 게시글 제목 가져오기
    const fetchPostTitle = async (postIdx) => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.get(`http://localhost/post/detail/${postIdx}`, {
                headers: { Authorization: token }
            });
            
            if (response.data.success && response.data.post) {
                return response.data.post.post_title || "제목 없음";
            }
            return "제목 없음";
        } catch (error) {
            console.error(`게시글 ${postIdx} 제목 로딩 실패:`, error);
            return "제목을 불러올 수 없음";
        }
    };

    // 활동 내역 가져오기
    const fetchActivities = async (userId) => {
        try {
            const token = sessionStorage.getItem("token");
            let res;
            
            try {
                res = await axios.get(`http://localhost/profile/activity/${userId}`, {
                    headers: { Authorization: token }
                });
            } catch (error) {
                // activity API가 없으면 빈 데이터로 설정
                console.log("활동 내역 API 없음, 빈 데이터 설정");
                setActivities({
                    posts: [],
                    comments: [],
                    likes: [],
                    searches: []
                });
                
                // 검색 내역은 별도로 가져오기
                await fetchSearchHistory(userId);
                return;
            }

            if (res.data.success) {
                let likesData = res.data.likes || [];
                
                // 추천한 글에 제목이 없는 경우 별도로 제목 가져오기
                if (likesData.length > 0) {
                    for (let like of likesData) {
                        if (!like.post_title && like.post_idx) {
                            console.log(`추천한 글 ${like.post_idx} 제목 조회 중...`);
                            like.post_title = await fetchPostTitle(like.post_idx);
                        }
                    }
                }

                setActivities({
                    posts: res.data.posts || [],
                    comments: res.data.comments || [],
                    likes: likesData,
                    searches: res.data.searches || []
                });
                
                // 검색 내역이 없으면 별도로 가져오기
                if (!res.data.searches || res.data.searches.length === 0) {
                    await fetchSearchHistory(userId);
                }
            }
        } catch (error) {
            console.error("활동 내역 로딩 실패:", error);
        }
    };

    // 검색 내역 가져오기
    const fetchSearchHistory = async (userId) => {
        try {
            const token = sessionStorage.getItem("token");
            console.log("검색 내역 API 호출:", `/search/recent/${userId}`);
            
            try {
                const res = await axios.get(`http://localhost/search/recent/${userId}`, {
                    headers: { Authorization: token }
                });
                
                console.log("검색 내역 API 응답:", res.data);
                
                if (res.data.success && res.data.data) {
                    console.log("원본 검색 데이터:", res.data.data);
                    
                    // 날짜 필드명 확인 및 매핑
                    const processedSearches = res.data.data.map((search, index) => {
                        console.log(`검색 ${index}:`, search);
                        return {
                            search_keyword: search.sch_keyword || search.search_keyword || '키워드 없음',
                            search_date: search.sch_create_date || search.search_date || search.sch_date || new Date().toISOString()
                        };
                    });
                    
                    console.log("처리된 검색 데이터:", processedSearches);
                    
                    setActivities(prev => ({
                        ...prev,
                        searches: processedSearches
                    }));
                    console.log("검색 내역 설정 완료:", processedSearches.length);
                } else {
                    console.log("검색 데이터 없음 또는 실패:", res.data);
                }
            } catch (error) {
                console.log("검색 내역 API 실패, 더미 데이터 사용:", error);
                // API가 없으면 더미 데이터 사용
                const dummySearches = [
                    {
                        search_keyword: "암 치료법",
                        search_date: "2024-01-15T10:30:00"
                    },
                    {
                        search_keyword: "부작용 관리",
                        search_date: "2024-01-14T15:20:00"
                    },
                    {
                        search_keyword: "영양 관리",
                        search_date: "2024-01-13T09:45:00"
                    },
                    {
                        search_keyword: "운동 방법",
                        search_date: "2024-01-12T14:10:00"
                    },
                    {
                        search_keyword: "심리 상담",
                        search_date: "2024-01-11T11:25:00"
                    }
                ];
                
                setActivities(prev => ({
                    ...prev,
                    searches: dummySearches
                }));
                console.log("더미 검색 내역 설정 완료:", dummySearches.length);
            }
        } catch (error) {
            console.error("검색 내역 로딩 실패:", error);
        }
    };

    // 이미지 URL 생성 함수
    const getValidImageUrl = (url) => {
        if (!url || url === 'null' || url === 'undefined') {
            return "/defaultProfileImg.png";
        }
        
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        if (url.startsWith('/')) {
            return `http://localhost${url}`;
        }
        
        if (url.startsWith('profile/')) {
            return `http://localhost/file/${url}`;
        }
        
        return `http://localhost/${url}`;
    };

    // 탭 내용 렌더링
    const renderTabContent = () => {
        switch (tab) {
            case "posts":
                return (
                    <div className="activity-list">
                        {activities.posts.length > 0 ? (
                            activities.posts.map(post => (
                                <div key={post.post_idx} className="activity-item" 
                                     onClick={() => router.push(`/post/detail?post_idx=${post.post_idx}`)}>
                                    <div className="activity-header">
                                        <h4>{post.post_title}</h4>
                                        <UserWithIcons 
                                            userId={post.id || targetUserId} 
                                            onClick={(e, userId) => {
                                                e.stopPropagation();
                                                router.push(`/profile/view/${userId}`);
                                            }}
                                            className="activity-author"
                                        />
                                    </div>
                                    <p className="activity-date">{new Date(post.post_create_date).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="empty-message">작성한 게시글이 없습니다.</div>
                        )}
                    </div>
                );
            case "comments":
                return (
                    <div className="activity-list">
                        {activities.comments.length > 0 ? (
                            activities.comments.map(comment => (
                                <div key={comment.com_idx} className="activity-item"
                                     onClick={() => router.push(`/post/detail?post_idx=${comment.post_idx}`)}>
                                    <div className="activity-header">
                                        <h4>{comment.com_content}</h4>
                                        <UserWithIcons 
                                            userId={comment.id || targetUserId} 
                                            onClick={(e, userId) => {
                                                e.stopPropagation();
                                                router.push(`/profile/view/${userId}`);
                                            }}
                                            className="activity-author"
                                        />
                                    </div>
                                    <p className="activity-date">{new Date(comment.com_create_date).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="empty-message">댓글 단 글이 없습니다.</div>
                        )}
                    </div>
                );
            case "likes":
                return (
                    <div className="activity-list">
                        {activities.likes.length > 0 ? (
                            activities.likes.map((like, index) => (
                                <div key={`like-${like.post_idx}-${index}`} className="activity-item"
                                     onClick={() => router.push(`/post/detail?post_idx=${like.post_idx}`)}>
                                    <div className="activity-header">
                                        <h4>{like.post_title || "추천한 게시글"}</h4>
                                        <UserWithIcons 
                                            userId={like.author_id || targetUserId} 
                                            onClick={(e, userId) => {
                                                e.stopPropagation();
                                                router.push(`/profile/view/${userId}`);
                                            }}
                                            className="activity-author"
                                        />
                                    </div>
                                    <p className="activity-date">{new Date(like.like_date).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="empty-message">추천한 글이 없습니다.</div>
                        )}
                    </div>
                );
            case "searches":
                console.log("검색어 탭 렌더링 - 현재 activities.searches:", activities.searches);
                return (
                    <div className="activity-list">
                        {activities.searches.length > 0 ? (
                            activities.searches.map((search, index) => {
                                console.log(`검색어 ${index} 렌더링:`, search);
                                
                                // 검색어 추출 (다양한 필드명 지원)
                                const keyword = search.search_keyword || 
                                              search.sch_keyword || 
                                              search.keyword || 
                                              '키워드 없음';
                                
                                // 날짜 추출 (다양한 필드명 지원)
                                const dateField = search.search_date || 
                                                search.sch_create_date || 
                                                search.sch_date || 
                                                search.date;
                                
                                // 날짜 안전하게 처리
                                let displayDate = "날짜 정보 없음";
                                if (dateField) {
                                    const date = new Date(dateField);
                                    if (!isNaN(date.getTime())) {
                                        displayDate = date.toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        });
                                    }
                                }
                                
                                return (
                                    <div key={`search-${keyword}-${index}`} className="activity-item">
                                        <div className="activity-header">
                                            <h4>검색어: {keyword}</h4>
                                            <UserWithIcons 
                                                userId={targetUserId} 
                                                onClick={(e, userId) => {
                                                    e.stopPropagation();
                                                    router.push(`/profile/view/${userId}`);
                                                }}
                                                className="activity-author"
                                            />
                                        </div>
                                        <p className="activity-date">{displayDate}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-message">최근 검색어가 없습니다.</div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!user) return <div className="error-message">사용자 정보를 찾을 수 없습니다.</div>;

    return (
        <div className="view-profile">
            <div className="profile-header">
                <div className="profile-image">
                    <img 
                        src={user?.profile_photo ? getValidImageUrl(user.profile_photo) : "/defaultProfileImg.png"} 
                        alt="프로필 이미지"
                        className="profile-pic"
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = "/defaultProfileImg.png";
                        }}
                    />
                </div>
                <div className="profile-header-info">
                    <div className="profile-title">
                        <h2>{user.name}님의 프로필</h2>
                    </div>
                    <div className="intro-text">{user.intro}</div>
                </div>
            </div>

            <div className="profile-details">
                <p><strong>아이디:</strong> {user.id}</p>
                <p><strong>이름:</strong> {user.name}</p>
                {user.year && <p><strong>출생연도:</strong> {user.year}</p>}
                {user.gender && <p><strong>성별:</strong> {user.gender === 'M' ? '남성' : user.gender === 'F' ? '여성' : user.gender}</p>}
                <p><strong>진단명:</strong> {user.cancer}</p>
                <p><strong>병기:</strong> {user.stage}</p>
            </div>

            <div className="tab-section">
                <div className="tab-menu">
                    <button onClick={() => setTab("posts")} className={tab === "posts" ? "active" : ""}>
                        작성한 글
                    </button>
                    <button onClick={() => setTab("comments")} className={tab === "comments" ? "active" : ""}>
                        댓글 단 글
                    </button>
                    <button onClick={() => setTab("likes")} className={tab === "likes" ? "active" : ""}>
                        추천한 글
                    </button>
                    <button onClick={() => setTab("searches")} className={tab === "searches" ? "active" : ""}>
                        최근 검색어
                    </button>
                    <button onClick={() => router.push(`/profile/view/${targetUserId}/timeline`)} className="nav-button timeline-btn">
                        타임라인 보기
                    </button>
                    <button onClick={() => router.push(`/profile/view/${targetUserId}/level`)} className="nav-button level-btn">
                        레벨 보기
                    </button>
                    <button onClick={() => router.push(`/profile/view/${targetUserId}/badge`)} className="nav-button badge-btn">
                        배지 보기
                    </button>
                </div>

                <div className="tab-content">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
} 