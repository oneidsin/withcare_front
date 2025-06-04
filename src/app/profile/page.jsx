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
            // 프로필 조회 전에 방문 수 증가 API 호출
            console.log('=== 방문수 증가 API 호출 시작 ===');
            console.log('사용자 ID:', id);
            console.log('토큰:', token ? '존재함' : '없음');
            
            // 방문수 증가 API가 백엔드에서 구현되지 않았으므로 주석 처리
            // 방문수는 백엔드에서 다른 방식으로 관리되고 있음 (레벨 페이지에서 access_cnt 확인됨)
            console.log('ℹ️ 방문수 증가 API는 백엔드에서 구현되지 않았지만, 방문수 데이터는 정상적으로 관리되고 있습니다.');
            
            /*
            try {
                console.log('프로필 방문 수 증가 시도...');
                const visitResponse = await axios.post(`http://localhost:80/profile/visit/${id}`, {}, {
                    headers: { Authorization: token }
                });
                console.log('프로필 방문 수 증가 완료, 응답:', visitResponse.data);
                console.log('방문수 증가 API 상태 코드:', visitResponse.status);
            } catch (visitError) {
                console.error('=== 방문 수 증가 실패 ===');
                console.error('에러 객체:', visitError);
                if (visitError.response) {
                    console.error('방문 수 증가 실패 응답 상태:', visitError.response.status);
                    console.error('방문 수 증가 실패 응답 데이터:', visitError.response.data);
                    
                    // 404 에러인 경우 API가 구현되지 않은 것으로 판단
                    if (visitError.response.status === 404) {
                        console.warn('⚠️ 방문 수 증가 API가 구현되지 않았습니다. 백엔드에서 해당 API를 구현해야 합니다.');
                        console.warn('필요한 API: POST /profile/visit/{id}');
                        
                        // 로컬 스토리지에 방문 카운트 증가 (백엔드 미구현 대비)
                        const currentVisitCount = parseInt(localStorage.getItem(`visitCount_${id}`) || '0');
                        localStorage.setItem(`visitCount_${id}`, (currentVisitCount + 1).toString());
                        console.log('로컬 방문 카운트 증가:', currentVisitCount + 1);
                    } else if (visitError.response.status === 500) {
                        console.error('⚠️ 서버 내부 오류로 방문수 증가 실패');
                    }
                } else if (visitError.request) {
                    console.error('⚠️ 네트워크 오류: 서버에 요청을 보낼 수 없음');
                    console.error('요청 정보:', visitError.request);
                    
                    // 네트워크 오류인 경우에도 로컬 카운트 증가
                    const currentVisitCount = parseInt(localStorage.getItem(`visitCount_${id}`) || '0');
                    localStorage.setItem(`visitCount_${id}`, (currentVisitCount + 1).toString());
                    console.log('네트워크 오류로 인한 로컬 방문 카운트 증가:', currentVisitCount + 1);
                } else {
                    console.error('⚠️ 요청 설정 오류:', visitError.message);
                }
                // 방문 수 증가 실패해도 프로필 조회는 계속 진행
            }
            */
            
            console.log('=== 방문수 증가 API 호출 완료 ===');
            
            // 암 종류와 병기 데이터 가져오기 (실패해도 계속 진행)
            let cancerList = [];
            let stageList = [];
            
            try {
                const data = await fetchCancerStageData();
                cancerList = data.cancerList || [];
                stageList = data.stageList || [];
            } catch (error) {
                console.warn("암 종류/병기 데이터 로딩 실패, 기본값 사용:", error);
            }
            
            // 프로필 정보 요청
            const profileRes = await axios.get(`http://localhost/profile/${id}`, {
                headers: { Authorization: token }
            });

            console.log("프로필 API 응답:", profileRes.data);

            // 기본값 설정 - 세션 스토리지에서 이름 우선 사용
            let userData = {
                id: id,
                name: sessionStorage.getItem("name") || id,
                email: "정보 없음", // 백엔드에서 member 정보를 안주므로 기본값
                year: null,
                gender: null,
                cancer: "정보 없음",
                stage: "정보 없음",
                intro: "",
                profile_photo: null,
                profile_yn: true
            };

            if (profileRes && profileRes.data && profileRes.data.data) {
                const profileData = profileRes.data.data;
                console.log("Profile 데이터:", profileData);
                
                // ProfileDTO에서 제공하는 정보만 사용 (member 정보는 현재 null이므로 무시)
                // 단, null이 아닌 값이 있다면 사용
                if (profileData.name && profileData.name !== null && profileData.name !== "") {
                    userData.name = profileData.name;
                }
                if (profileData.email && profileData.email !== null && profileData.email !== "") {
                    userData.email = profileData.email;
                }
                if (profileData.year && profileData.year !== null) {
                    userData.year = profileData.year;
                }
                if (profileData.gender && profileData.gender !== null && profileData.gender !== "") {
                    userData.gender = profileData.gender;
                }
                if (profileData.intro && profileData.intro !== null) {
                    userData.intro = profileData.intro;
                }
                if (profileData.profile_photo && profileData.profile_photo !== null) {
                    userData.profile_photo = profileData.profile_photo;
                }
                if (profileData.profile_yn !== undefined && profileData.profile_yn !== null) {
                    userData.profile_yn = profileData.profile_yn;
                }
                
                // cancer_idx와 stage_idx를 실제 이름으로 변환
                let cancerName = "정보 없음";
                let stageName = "정보 없음";
                
                // cancer_idx 변환 (0이 아닌 유효한 값일 때만)
                if (profileData.cancer_idx && profileData.cancer_idx !== 0 && cancerList.length > 0) {
                    const foundCancer = cancerList.find(cancer => cancer.cancer_idx === profileData.cancer_idx);
                    if (foundCancer) {
                        cancerName = foundCancer.cancer_name;
                    }
                }
                
                // stage_idx 변환 (0이 아닌 유효한 값일 때만)
                if (profileData.stage_idx && profileData.stage_idx !== 0 && stageList.length > 0) {
                    const foundStage = stageList.find(stage => stage.stage_idx === profileData.stage_idx);
                    if (foundStage) {
                        stageName = foundStage.stage_name;
                    }
                }
                
                console.log("변환된 진단명:", cancerName);
                console.log("변환된 병기:", stageName);
                
                // 암 종류와 병기 정보 업데이트
                userData.cancer = cancerName;
                userData.stage = stageName;
                
                console.log("Profile 정보 병합 완료:", profileData);
            } else {
                console.warn("Profile API에서 데이터를 가져올 수 없습니다. 기본값 사용.");
            }
            
            console.log("최종 사용자 데이터:", userData);
            setUser(userData);
            
            // 프로필 이미지가 있으면 세션 스토리지에 저장
            if (userData.profile_photo) {
                const profileImageUrl = getValidImageUrl(userData.profile_photo);
                sessionStorage.setItem("profilePic", profileImageUrl);
                
                // 프로필 업데이트 이벤트 발생
                window.dispatchEvent(new Event('profileUpdated'));
            }
            
            // 활동 내역 가져오기 (실패해도 프로필은 표시)
            try {
                await fetchActivities(id);
            } catch (activityError) {
                console.warn("활동 내역 로딩 실패, 프로필은 정상 표시:", activityError);
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
                
                // 500 에러 (백엔드 null 처리 문제)인 경우 기본 프로필 표시
                if (error.response.status === 500) {
                    console.warn("백엔드 500 에러 발생, 기본 프로필 정보 표시");
                    setDefaultUserInfo(id);
                    alert("프로필 일부 정보를 불러올 수 없어 기본 정보를 표시합니다.");
                    return;
                }
            }
            
            // API 호출 실패 시 기본 정보라도 표시
            console.warn("API 호출 실패, 기본 프로필 정보 표시");
            setDefaultUserInfo(id);
        }
    };

    // 기본 사용자 정보 설정 함수
    const setDefaultUserInfo = (id) => {
        const storedName = sessionStorage.getItem("name");
        const defaultUser = {
            id: id,
            name: storedName || id,
            email: "정보 없음",
            year: null,
            gender: null,
            cancer: "정보 없음",
            stage: "정보 없음",
            intro: "",
            profile_photo: null,
            profile_yn: true
        };
        
        setUser(defaultUser);
        console.log("기본 사용자 정보 설정:", defaultUser);
    };

    const handleDeleteAccount = async () => {
        if (!confirm("정말로 회원 탈퇴하시겠습니까?")) return;

        const token = sessionStorage.getItem("token");
        const id = sessionStorage.getItem("id");

        try {
            const response = await fetch(`http://localhost/delete/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = `회원 탈퇴에 실패했습니다. (${response.status})`;
                
                if (response.status === 401) {
                    alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                    sessionStorage.clear();
                    router.push("/login");
                    return;
                }
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.msg || errorMessage;
                } catch (e) {
                    // JSON 파싱 실패 시 기본 메시지 사용
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (data.success) {
                alert("회원 탈퇴가 완료되었습니다.");
                sessionStorage.clear();
                
                // 로그아웃 상태 업데이트를 위한 이벤트 발생
                window.dispatchEvent(new Event('logout'));
                
                router.push("/");
            } else {
                alert(data.msg || "회원 탈퇴에 실패했습니다.");
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
            const fullUrl = `http://localhost${url}`;
            console.log("루트 경로 URL 변환:", fullUrl);
            return fullUrl;
        }
        
        // profile/ 경로로 시작하는 경우 file/ 접두사 추가
        if (url.startsWith('profile/')) {
            const fullUrl = `http://localhost/file/${url}`;
            console.log("프로필 이미지 변환된 URL:", fullUrl);
            return fullUrl;
        }
        
        // 그 외의 경우 백엔드 기본 URL에 경로 추가
        const fullUrl = `http://localhost/${url}`;
        console.log("변환된 URL:", fullUrl);
        return fullUrl;
    };

    // 암 종류와 병기 정보 가져오기
    const fetchCancerStageData = async () => {
        try {
            console.log("암 종류/병기 데이터 요청 시작");
            
            const [cancerRes, stageRes] = await Promise.all([
                axios.get("http://localhost/cancer").catch(err => {
                    console.error("암 종류 API 호출 실패:", err);
                    return { data: [] };
                }),
                axios.get("http://localhost/stage").catch(err => {
                    console.error("병기 API 호출 실패:", err);
                    return { data: [] };
                })
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
                        src={user?.profile_photo ? getValidImageUrl(user.profile_photo) : "/defaultProfileImg.png"} 
                        alt="프로필 이미지"
                        className="profile-pic"
                        onError={(e) => { 
                            console.error("이미지 로드 실패:", e.target.src);
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


