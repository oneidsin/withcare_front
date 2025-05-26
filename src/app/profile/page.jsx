"use client";

import React, { useEffect, useState } from "react";
import "./profile.css";

const mockUserData = {
    username: "admin",
    role: "관리자 🛡️",
    visitCount: 1,
    profileImage: "",
    intro: "소개글을 작성해주세요.",
    diagnosis: "관리자",
    stage: "관리자",
    isPublic: true
};

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState("posts");
    const [activityTab, setActivityTab] = useState("timeline");

    const [activeActivity, setActiveActivity] = useState(""); // 활동내역용

    useEffect(() => {
        setUser(mockUserData);
    }, []);

    if (!user) return <div>로딩 중...</div>;

    const renderActivityContent = () => {
        switch (activityTab) {
            case "timeline":
                return <div>타임라인 내용</div>;
            case "level":
                return <div>레벨 정보</div>;
            case "badge":
                return <div>뱃지 리스트</div>;
            default:
                return null;
        }
    };

    const renderTabContent = () => {
        switch (tab) {
            case "posts":
                return <div>작성하신 게시글이 없습니다.</div>;
            case "comments":
                return <div>댓글 단 글이 없습니다.</div>;
            case "likes":
                return <div>추천한 글이 없습니다.</div>;
            case "searches":
                return <div>최근 검색어가 없습니다.</div>;
            default:
                return null;
        }
    };

    return (
        <div className="profile-page">
            {/* 좌측 유저 정보 */}
            <aside className="sidebar">
                <div className="user-info">
                    <img
                        src={user.profileImage || "/icons/profile.svg"}
                        alt="프로필 사진"
                        className="profile-img"
                    />
                    <div className="username">{user.username}님</div>
                    <div className="role">{user.role}</div>
                    <div className="visit">방문: {user.visitCount}회</div>
                </div>

                <div className="activity-box">
                    <h4>활동 내역</h4>
                    <ul>
                        <li
                            className={activeActivity === "timeline" ? "active" : ""}
                            onClick={() => setActiveActivity("timeline")}>
                            타임라인
                        </li>
                        <li
                            className={activeActivity === "level" ? "active" : ""}
                            onClick={() => setActiveActivity("level")}>
                            레벨
                        </li>
                        <li
                            className={activeActivity === "badge" ? "active" : ""}
                            onClick={() => setActiveActivity("badge")}>
                            뱃지
                        </li>
                    </ul>
                </div>
            </aside>

            {/* 우측 프로필 정보 */}
            <main className="main-profile">
                <div className="profile-header">
                    <img
                        src={user.profileImage || "/icons/profile.svg"}
                        alt="프로필 사진"
                        className="profile-img"
                    />
                    <div>
                        <div className="username">{user.username}님</div>
                        <div className="intro-text">{user.intro}</div>
                    </div>
                </div>

                <div className="profile-details">
                    <p><strong>아이디:</strong> {user.username}</p>
                    <p><strong>진단명:</strong> {user.diagnosis}</p>
                    <p><strong>병기:</strong> {user.stage}</p>
                    <p><strong>프로필 공개 여부:</strong> {user.isPublic ? "공개" : "비공개"}</p>
                </div>

                <div className="tab-section">
                    <div className="tab-menu">
                        <button onClick={() => setTab("posts")} className={tab === "posts" ? "active" : ""}>작성한 글</button>
                        <button onClick={() => setTab("comments")} className={tab === "comments" ? "active" : ""}>댓글 단 글</button>
                        <button onClick={() => setTab("likes")} className={tab === "likes" ? "active" : ""}>추천한 글</button>
                        <button onClick={() => setTab("searches")} className={tab === "searches" ? "active" : ""}>최근 검색어</button>
                    </div>

                    <div className="tab-content">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}