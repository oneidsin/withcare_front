"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./level.css";

export default function ViewUserLevelPage() {
    const router = useRouter();
    const params = useParams();
    const targetUserId = params.id;
    
    const [user, setUser] = useState(null);
    const [currentLevel, setCurrentLevel] = useState(null);
    const [nextLevel, setNextLevel] = useState(null);
    const [allLevels, setAllLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            router.push("/login");
            return;
        }

        fetchLevelData();
    }, [targetUserId]);

    const fetchLevelData = async () => {
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
                level: userData?.level || 1,
                exp: userData?.exp || 0
            });

            // 레벨 정보 가져오기
            try {
                const levelRes = await axios.get("http://localhost/level", {
                    headers: { Authorization: token }
                });

                if (levelRes.data) {
                    const levels = Array.isArray(levelRes.data) ? levelRes.data : levelRes.data.data || [];
                    setAllLevels(levels);

                    const userLevel = userData?.level || 1;
                    const current = levels.find(level => level.level_idx === userLevel);
                    const next = levels.find(level => level.level_idx === userLevel + 1);

                    setCurrentLevel(current);
                    setNextLevel(next);
                    console.log("레벨 데이터 로드 완료:", levels.length);
                } else {
                    setAllLevels([]);
                    console.log("레벨 데이터 없음");
                }
            } catch (error) {
                console.log("레벨 API 호출 실패:", error);
                setAllLevels([]);
                setCurrentLevel(null);
                setNextLevel(null);
            }

        } catch (error) {
            console.error("레벨 데이터 로딩 실패:", error);
            setError("레벨 정보를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="view-user-level">
            <div className="level-header">
                <button className="back-button" onClick={() => router.push(`/profile/view/${targetUserId}`)}>
                    ← 프로필로 돌아가기
                </button>
                <h2>{user?.name}님의 레벨 정보</h2>
            </div>

            {/* 현재 레벨 섹션 */}
            <div className="current-level-section">
                <h3>현재 레벨</h3>
                <div className="level-card current">
                    <div className="level-info">
                        <div className="level-number">Lv.{currentLevel?.level_idx || 1}</div>
                        <div className="level-name">{currentLevel?.level_name || "새싹"}</div>
                        <div className="level-exp">경험치: {user?.exp || 0}</div>
                    </div>
                    {currentLevel?.level_icon && (
                        <div className="level-icon">
                            <img src={currentLevel.level_icon} alt="레벨 아이콘" />
                        </div>
                    )}
                </div>
            </div>

            {/* 다음 레벨 섹션 */}
            {nextLevel && (
                <div className="next-level-section">
                    <h3>다음 레벨</h3>
                    <div className="level-card next">
                        <div className="level-info">
                            <div className="level-number">Lv.{nextLevel.level_idx}</div>
                            <div className="level-name">{nextLevel.level_name}</div>
                            <div className="required-exp">
                                필요 경험치: {nextLevel.required_exp - (user?.exp || 0)} 
                                (총 {nextLevel.required_exp})
                            </div>
                        </div>
                        {nextLevel.level_icon && (
                            <div className="level-icon">
                                <img src={nextLevel.level_icon} alt="레벨 아이콘" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 전체 레벨 목록 */}
            <div className="all-levels-section">
                <h3>전체 레벨</h3>
                <div className="levels-grid">
                    {allLevels.map(level => {
                        const isAchieved = (user?.exp || 0) >= level.required_exp;
                        const isCurrent = level.level_idx === currentLevel?.level_idx;
                        
                        return (
                            <div 
                                key={level.level_idx} 
                                className={`level-item ${isAchieved ? 'achieved' : 'not-achieved'} ${isCurrent ? 'current' : ''}`}
                            >
                                <div className="level-number">Lv.{level.level_idx}</div>
                                <div className="level-name">{level.level_name}</div>
                                <div className="required-exp">
                                    필요: {level.required_exp} exp
                                </div>
                                {level.level_icon && (
                                    <div className="level-icon">
                                        <img src={level.level_icon} alt="레벨 아이콘" />
                                    </div>
                                )}
                                <div className="status">
                                    {isCurrent ? "현재 레벨" : isAchieved ? "달성" : "미달성"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
} 