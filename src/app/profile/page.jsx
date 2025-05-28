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

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const id = sessionStorage.getItem("id");

        if (!token || !id) {
            alert("로그인이 필요합니다.");
            router.push("/login");
            return;
        }

        // 프로필 정보 가져오기
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`http://localhost/profile/${id}`, {
                    headers: { Authorization: token }
                });

                if (res.data.status === "success") {
                    setUser({
                        id: res.data.data.id,
                        name: res.data.data.name,
                        cancer: res.data.data.cancer_name || "미입력",
                        stage: res.data.data.stage_name || "미입력",
                        intro: res.data.data.intro || "소개글을 작성해주세요.",
                        profileImage: res.data.data.profile_photo,
                        isPublic: res.data.data.profile_yn
                    });
                } else {
                    alert("프로필 정보를 불러올 수 없습니다.");
                }
            } catch (error) {
                console.error("프로필 로딩 실패:", error);
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

        fetchProfile();
        fetchActivities();
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
                            <p>작성하신 게시글이 없습니다.</p>
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
                            <p>댓글 단 글이 없습니다.</p>
                        )}
                    </div>
                );
            case "likes":
                return (
                    <div className="activity-list">
                        {activities.likes.length > 0 ? (
                            activities.likes.map(like => (
                                <div key={`${like.post_idx}-${like.id}`} className="activity-item"
                                     onClick={() => router.push(`/post/detail?post_idx=${like.post_idx}`)}>
                                    <p>추천한 게시글</p>
                                    <p>{new Date(like.like_date).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <p>추천한 글이 없습니다.</p>
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
                            <p>최근 검색어가 없습니다.</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    if (!user) return <div>로딩 중...</div>;

    return (
        <div className="main-profile">
            <div className="top-right">
                <button className="delete-btn" onClick={handleDeleteAccount}>
                    회원 탈퇴하기
                </button>
            </div>

            <div className="profile-header">
                <div className="profile-image">
                    <img 
                        src={user.profileImage || "/defaultProfileImg.png"} 
                        alt="프로필 이미지"
                        className="profile-pic"
                    />
                </div>
                <div className="profile-header-info">
                    <div className="profile-title">
                        <h2>{user.id}님의 프로필</h2>
                        <button className="edit-btn" onClick={handleEditProfile}>
                            회원정보 수정하기
                        </button>
                    </div>
                    <div className="intro-text">{user.intro}</div>
                </div>
            </div>

            <div className="profile-details">
                <p><strong>아이디:</strong> {user.id}</p>
                <p><strong>이름:</strong> {user.name}</p>
                <p><strong>진단명:</strong> {user.cancer}</p>
                <p><strong>병기:</strong> {user.stage}</p>
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
