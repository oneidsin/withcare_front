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
        const storedName = sessionStorage.getItem("name");

        if (!token || !id) {
            alert("로그인이 필요합니다.");
            router.push("/login");
            return;
        }

        // 콘솔에 현재 세션 스토리지 상태 출력
        console.log("세션 스토리지 상태:", {
            id: sessionStorage.getItem("id"),
            name: sessionStorage.getItem("name"),
            token: sessionStorage.getItem("token"),
            profilePic: sessionStorage.getItem("profilePic")
        });

        // 회원 테이블에서 이름 가져오기 (member 테이블 직접 조회)
        const fetchMemberName = async () => {
            try {
                // 세션 스토리지에 이름이 있으면 그대로 사용
                if (storedName) {
                    console.log("세션 스토리지에서 이름 가져옴:", storedName);
                    return storedName;
                }
                
                // 세션 스토리지에 이름이 없으면 프로필 정보에서 이름 가져오기
                console.log("프로필 정보에서 이름 가져오기 시도");
                return id; // 임시로 ID 반환 (나중에 프로필 정보에서 덮어씀)
            } catch (error) {
                console.error("회원 정보 가져오기 실패:", error);
                return storedName || id; // 실패 시 저장된 이름 또는 ID 사용
            }
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

        // 프로필 정보 가져오기
        const fetchProfile = async () => {
            try {
                // 회원 이름 가져오기
                const memberName = await fetchMemberName();
                console.log("가져온 회원 이름:", memberName);
                
                // 암 종류와 병기 데이터 가져오기
                const { cancerList, stageList } = await fetchCancerStageData();
                
                // 프로필 정보 요청
                const res = await axios.get(`http://localhost/profile/${id}`, {
                    headers: { Authorization: token }
                });

                console.log("프로필 API 응답:", res.data);

                if (res.data.status === "success") {
                    console.log("서버 응답 데이터:", res.data.data);
                    
                    // 이름 확인 및 설정
                    const userName = res.data.data.name || memberName;
                    
                    // cancer_idx와 stage_idx의 실제 값 확인
                    console.log("진단명 idx:", res.data.data.cancer_idx);
                    console.log("병기 idx:", res.data.data.stage_idx);
                    
                    // cancer_idx와 stage_idx를 이용해 이름 찾기
                    let cancerName = "정보 없음";
                    let stageName = "정보 없음";
                    
                    if (res.data.data.cancer_idx && cancerList.length > 0) {
                        const cancer = cancerList.find(c => c.cancer_idx === res.data.data.cancer_idx);
                        cancerName = cancer ? cancer.cancer_name : "정보 없음";
                    }
                    
                    if (res.data.data.stage_idx && stageList.length > 0) {
                        const stage = stageList.find(s => s.stage_idx === res.data.data.stage_idx);
                        stageName = stage ? stage.stage_name : "정보 없음";
                    }
                    
                    console.log("찾은 진단명:", cancerName);
                    console.log("찾은 병기:", stageName);
                    
                    // 데이터 확인 및 저장
                    const userData = {
                        id: res.data.data.id,
                        name: userName,
                        cancer_idx: res.data.data.cancer_idx,
                        stage_idx: res.data.data.stage_idx,
                        cancer: cancerName,
                        stage: stageName,
                        intro: res.data.data.intro || "소개글을 작성해주세요.",
                        profileImage: getValidImageUrl(res.data.data.profile_photo),
                        isPublic: res.data.data.profile_yn
                    };
                    
                    console.log("가공된 사용자 데이터:", userData);
                    
                    // 세션 스토리지에 정보 저장
                    sessionStorage.setItem("profilePic", userData.profileImage);
                    sessionStorage.setItem("name", userData.name);
                    
                    // 상태 업데이트
                    setUser(userData);
                    
                    // 활동 내역 가져오기
                    fetchActivities();
                } else {
                    console.error("프로필 정보를 불러올 수 없습니다:", res.data);
                    alert("프로필 정보를 불러올 수 없습니다.");
                }
            } catch (error) {
                console.error("프로필 로딩 실패:", error);
                
                if (error.response) {
                    console.error("오류 응답:", error.response.data);
                    console.error("오류 상태:", error.response.status);
                }
                
                alert("프로필 정보를 불러오는데 실패했습니다.");
            }
        };

        // 활동 내역 가져오기
        const fetchActivities = async () => {
            try {
                const res = await axios.get(`http://localhost/profile/view/${id}`, {
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

        // 프로필 정보 로드 시작
        fetchProfile();
    }, []);

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
        if (!url || url === 'null' || url === 'undefined') {
            return "/defaultProfileImg.png";
        }
        
        // URL이 이미 http://로 시작하는지 확인
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // URL이 /로 시작하는지 확인 (절대 경로)
        if (url.startsWith('/')) {
            return url;
        }
        
        // 그 외의 경우 백엔드 기본 URL에 경로 추가
        return `http://localhost/${url}`;
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
                        src={user?.profileImage || "/defaultProfileImg.png"} 
                        alt="프로필 이미지"
                        className="profile-pic"
                        onError={(e) => { e.target.onerror = null; e.target.src = "/defaultProfileImg.png"; }}
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
