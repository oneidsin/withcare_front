"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./badge.css";

export default function ViewUserBadgePage() {
    const router = useRouter();
    const params = useParams();
    const targetUserId = params.id;
    
    const [user, setUser] = useState(null);
    const [userBadges, setUserBadges] = useState([]);
    const [allBadges, setAllBadges] = useState([]);
    const [mainBadge, setMainBadge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            router.push("/login");
            return;
        }

        fetchBadgeData();
    }, [targetUserId]);

    const fetchBadgeData = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem("token");

            // 사용자 기본 정보 가져오기
            let profileRes;
            try {
                profileRes = await axios.get(`http://localhost/profile/view/${targetUserId}`, {
                    headers: { Authorization: token }
                });
            } catch (error) {
                profileRes = await axios.get(`http://localhost/profile/${targetUserId}`, {
                    headers: { Authorization: token }
                });
            }

            // 사용자 정보 처리
            let userData = null;
            if (profileRes.data?.profile) {
                userData = profileRes.data.profile;
            } else if (profileRes.data?.data) {
                userData = profileRes.data.data;
            } else {
                userData = profileRes.data;
            }

            setUser({
                id: targetUserId,
                name: userData?.name || userData?.id || targetUserId,
                main_badge_idx: userData?.main_badge_idx || null
            });

            // 전체 배지 목록 가져오기
            try {
                const allBadgesRes = await axios.get("http://localhost/badge", {
                    headers: { Authorization: token }
                });

                if (allBadgesRes.data) {
                    const badges = Array.isArray(allBadgesRes.data) ? allBadgesRes.data : allBadgesRes.data.data || [];
                    setAllBadges(badges);
                    console.log("전체 배지 데이터 로드 완료:", badges.length);
                } else {
                    setAllBadges([]);
                    console.log("전체 배지 데이터 없음");
                }
            } catch (error) {
                console.log("전체 배지 API 호출 실패:", error);
                setAllBadges([]);
            }

            // 사용자 배지 정보 가져오기
            try {
                const userBadgesRes = await axios.get(`http://localhost/badge/user/${targetUserId}`, {
                    headers: { Authorization: token }
                });

                if (userBadgesRes.data) {
                    const userBadgeData = Array.isArray(userBadgesRes.data) ? userBadgesRes.data : userBadgesRes.data.data || [];
                    setUserBadges(userBadgeData);

                    // 메인 배지 설정
                    if (userData?.main_badge_idx) {
                        const mainBadgeData = userBadgeData.find(badge => badge.badge_idx === userData.main_badge_idx);
                        setMainBadge(mainBadgeData);
                    }
                    console.log("사용자 배지 데이터 로드 완료:", userBadgeData.length);
                } else {
                    setUserBadges([]);
                    console.log("사용자 배지 데이터 없음");
                }
            } catch (error) {
                console.log("사용자 배지 API 호출 실패:", error);
                setUserBadges([]);
            }

        } catch (error) {
            console.error("배지 데이터 로딩 실패:", error);
            setError("배지 정보를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 배지 아이콘 URL 생성
    const getBadgeIconUrl = (icon) => {
        if (!icon || icon === 'null' || icon === 'undefined') {
            return "/defaultBadge.png";
        }
        
        if (icon.startsWith('http://') || icon.startsWith('https://')) {
            return icon;
        }
        
        return `http://localhost/${icon}`;
    };

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="view-user-badge">
            <div className="badge-header">
                <button className="back-button" onClick={() => router.push(`/profile/view/${targetUserId}`)}>
                    ← 프로필로 돌아가기
                </button>
                <h2>{user?.name}님의 배지 정보</h2>
            </div>

            {/* 메인 배지 섹션 */}
            {mainBadge && (
                <div className="main-badge-section">
                    <h3>메인 배지</h3>
                    <div className="badge-card main">
                        <div className="badge-icon">
                            <img 
                                src={getBadgeIconUrl(mainBadge.badge_icon)} 
                                alt={mainBadge.badge_name}
                                onError={(e) => { 
                                    e.target.onerror = null; 
                                    e.target.src = "/defaultBadge.png";
                                }}
                            />
                        </div>
                        <div className="badge-info">
                            <div className="badge-name">{mainBadge.badge_name}</div>
                            <div className="badge-description">{mainBadge.badge_description}</div>
                            <div className="earned-date">
                                획득일: {new Date(mainBadge.earned_date).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 획득한 배지 섹션 */}
            <div className="earned-badges-section">
                <h3>획득한 배지 ({userBadges.length}개)</h3>
                <div className="badges-grid">
                    {userBadges.length > 0 ? (
                        userBadges.map(badge => (
                            <div key={badge.badge_idx} className="badge-item earned">
                                <div className="badge-icon">
                                    <img 
                                        src={getBadgeIconUrl(badge.badge_icon)} 
                                        alt={badge.badge_name}
                                        onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = "/defaultBadge.png";
                                        }}
                                    />
                                </div>
                                <div className="badge-name">{badge.badge_name}</div>
                                <div className="badge-description">{badge.badge_description}</div>
                                <div className="earned-date">
                                    {new Date(badge.earned_date).toLocaleDateString()}
                                </div>
                                {badge.badge_idx === mainBadge?.badge_idx && (
                                    <div className="main-badge-indicator">메인 배지</div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-message">획득한 배지가 없습니다.</div>
                    )}
                </div>
            </div>

            {/* 미획득 배지 섹션 */}
            <div className="not-earned-badges-section">
                <h3>미획득 배지</h3>
                <div className="badges-grid">
                    {allBadges.filter(badge => !userBadges.some(userBadge => userBadge.badge_idx === badge.badge_idx)).map(badge => (
                        <div key={badge.badge_idx} className="badge-item not-earned">
                            <div className="badge-icon">
                                <img 
                                    src={getBadgeIconUrl(badge.badge_icon)} 
                                    alt={badge.badge_name}
                                    onError={(e) => { 
                                        e.target.onerror = null; 
                                        e.target.src = "/defaultBadge.png";
                                    }}
                                />
                            </div>
                            <div className="badge-name">{badge.badge_name}</div>
                            <div className="badge-description">{badge.badge_description}</div>
                            <div className="not-earned-indicator">미획득</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 