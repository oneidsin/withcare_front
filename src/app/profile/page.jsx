"use client";

import React, { useEffect, useState } from "react";
import "./profile.css";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function ProfilePage() {
    const router = useRouter();
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

   

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const id = sessionStorage.getItem("id");
        // sessionStorage에서 name 가져오기 시도
    
        
        

        if (!token || !id) {
            alert("로그인이 필요합니다.");
            router.push("/login");
            return;
        }
    
        

        // fetchMemberName 함수와 fetchProfile 함수 대신 fetchData 함수 직접 호출
        fetchData(id, token);
    }, []);


    // 페이지 로드 시 항상 새로운 데이터 가져오기 (캐시 무시)
    const fetchData = async (id, token) => {
        try {
            // 암 종류와 병기 데이터 가져오기
            const { cancerList, stageList } = await fetchCancerStageData();
            
            // 프로필 정보 요청 - 캐시 방지를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            const res = await axios.get(`http://localhost/profile/${id}`, {
                headers: {Authorization: token}
            });

            console.log("프로필 API 응답:", res.data);

            if (res.data && res.data.data) {
                // 상태 업데이트 - 서버에서 받은 데이터 구조에 맞게 설정
                setUser(res.data.data);
                
                // 활동 내역 가져오기
                fetchActivities(id);
            } else {
                console.error("프로필 정보를 불러올 수 없습니다:", res.data);
                alert("프로필 정보를 불러올 수 없습니다.");
            }
        } catch (error) {
            console.error("프로필 로딩 실패:", error);
            
            if (error.response) {
                console.error("오류 응답:", error.response.data);
                console.error("오류 상태:", error.response.status);
                
                // JWT 토큰 에러 처리
                if (error.response.status === 401 || 
                    (error.response.data && error.response.data.message && 
                     error.response.data.message.includes("JWT"))) {
                    alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                    sessionStorage.clear();
                    router.push("/login");
                    return;
                }
            }
            
            alert("프로필 정보를 불러오는데 실패했습니다.");
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("정말로 회원 탈퇴하시겠습니까?")) return;

        const token = sessionStorage.getItem("token");
        const id = sessionStorage.getItem("id");

        try {
            const res = await axios.delete(`http://localhost/member/delete/${id}`, {
                headers: { Authorization: token }
            });

            if (res.data.success) {
                alert("회원 탈퇴가 완료되었습니다.");
                sessionStorage.clear();
                router.push("/");
            } else {
                alert("회원 탈퇴에 실패했습니다.");
            }
        } catch (error) {
            console.error("회원 탈퇴 실패:", error);
            alert("회원 탈퇴 처리 중 오류가 발생했습니다.");
        }
    };

    const handleEditProfile = () => {
        router.push("/profile/update");
    };

    const renderTabContent = () => {
        switch (tab) {
            case "posts":
                return (
                    <div className="activity-list">
                        {activities.posts.length > 0 ? (
                            activities.posts.map(post => (
                                <div key={post.post_idx} className="activity-item" 
                                     onClick={() => router.push(`/post/detail?post_idx=${post.post_idx}`)}>
                                    <h4>{post.post_title}</h4>
                                    <p>{new Date(post.post_create_date).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="empty-message">작성하신 게시글이 없습니다.</div>
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
                                    <p>{comment.com_content}</p>
                                    <p>{new Date(comment.com_create_date).toLocaleDateString()}</p>
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
                                <div key={`like-${like.post_idx}-${index}-${new Date(like.like_date).getTime()}`} className="activity-item"
                                     onClick={() => router.push(`/post/detail?post_idx=${like.post_idx}`)}>
                                    <p>추천한 게시글</p>
                                    <p>{new Date(like.like_date).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="empty-message">추천한 글이 없습니다.</div>
                        )}
                    </div>
                );
            case "searches":
                return (
                    <div className="activity-list">
                        {activities.searches.length > 0 ? (
                            activities.searches.map((search, index) => (
                                <div key={index} className="activity-item">
                                    <p>{search.sch_keyword}</p>
                                    <p>{new Date(search.sch_date).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="empty-message">최근 검색어가 없습니다.</div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    // 유효한 이미지 URL 생성 함수
    const getValidImageUrl = (url) => {
        console.log("이미지 URL 변환 전:", url);
        
        if (!url || url === 'null' || url === 'undefined') {
            console.log("기본 이미지 사용");
            return "/defaultProfileImg.png";
        }
        
        // URL이 이미 http://로 시작하는지 확인
        if (url.startsWith('http://') || url.startsWith('https://')) {
            console.log("절대 URL 사용:", url);
            return url;
        }
        
        // URL이 /로 시작하는지 확인 (절대 경로)
        if (url.startsWith('/')) {
            console.log("루트 경로 URL 사용:", url);
            return url;
        }
        
        // 그 외의 경우 백엔드 기본 URL에 경로 추가
        const fullUrl = `http://localhost/${url}`;
        console.log("변환된 URL:", fullUrl);
        return fullUrl;
    };

    // 암 종류와 병기 정보 가져오기
    const fetchCancerStageData = async () => {
        try {
            const [cancerRes, stageRes] = await Promise.all([
                axios.get("http://localhost/cancer"),
                axios.get("http://localhost/stage")
            ]);
            
            console.log("암 종류 데이터:", cancerRes.data);
            console.log("병기 데이터:", stageRes.data);
            
            setCancerList(cancerRes.data || []);
            setStageList(stageRes.data || []);
            
            return {
                cancerList: cancerRes.data || [],
                stageList: stageRes.data || []
            };
        } catch (error) {
            console.error("암 종류/병기 데이터 로딩 실패:", error);
            return { cancerList: [], stageList: [] };
        }
    };

    // 활동 내역 가져오기
    const fetchActivities = async (userId) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await axios.get(`http://localhost/profile/view/${userId}`, {
                headers: { Authorization: token }
            });

            if (res.data.status === "success") {
                setActivities({
                    posts: res.data.posts || [],
                    comments: res.data.comments || [],
                    likes: res.data.likes || [],
                    searches: res.data.searches || []
                });
            }
        } catch (error) {
            console.error("활동 내역 로딩 실패:", error);
        }
    };

    if (!user) return <div>로딩 중...</div>;

    return (
        <div className="main-profile">
            <div className="top-right">
                <button className="edit-btn" onClick={handleEditProfile}>
                    회원정보 수정하기
                </button>
                <button className="delete-btn" onClick={handleDeleteAccount}>
                    회원 탈퇴하기
                </button>
            </div>

            <div className="profile-header">
                <div className="profile-image">
                    <img 
                        src={user?.profile_photo || "/defaultProfileImg.png"} 
                        alt="프로필 이미지"
                        className="profile-pic"
                        onError={(e) => { 
                            console.error("이미지 로드 실패:", e.target.src);
                            // 먼저 세션 스토리지의 이미지를 시도
                            
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
                <p><strong>아이디:</strong> {user.id || "정보 없음"}</p>
                <p><strong>이름:</strong> {user.name || "정보 없음"}</p>
                <p><strong>이메일:</strong> {user.email || "정보 없음"}</p>
                {user.year && <p><strong>출생연도:</strong> {user.year}</p>}
                {user.gender && <p><strong>성별:</strong> {user.gender === 'M' ? '남성' : user.gender === 'F' ? '여성' : user.gender}</p>}
                <p><strong>진단명:</strong> {user.cancer || "정보 없음"}</p>
                <p><strong>병기:</strong> {user.stage || "정보 없음"}</p>
                <p><strong>프로필 공개 여부:</strong> {user.isPublic ? "공개" : "비공개"}</p>
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
                </div>

                <div className="tab-content">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}
