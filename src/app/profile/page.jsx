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
    isPublic: true,
};

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState("posts");

    useEffect(() => {
        setUser(mockUserData);
    }, []);

    const handleDeleteAccount = () => {
        const confirmed = confirm("정말로 회원 탈퇴하시겠습니까?");
        if (confirmed) {
            // TODO: 실제 탈퇴 API 호출
            alert("회원 탈퇴가 완료되었습니다.");
            location.href = "/"; // 메인 페이지로 이동
        }
    };

    if (!user) return <div>로딩 중...</div>;

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
        <div className="main-profile">
            {/* 오른쪽 상단 탈퇴 버튼 */}
            <div className="top-right">
                <button className="delete-btn" onClick={handleDeleteAccount}>
                    회원 탈퇴하기
                </button>
            </div>

            <div className="profile-header">
                <img
                    src={user.profileImage || "/icons/profile.svg"}
                    alt="프로필 사진"
                    className="profile-img"/>
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
        </div>
    );
}
