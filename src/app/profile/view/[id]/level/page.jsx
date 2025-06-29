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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            // 토큰이 없으면 로그인 페이지로 리다이렉트
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

        fetchLevelData();
    }, [targetUserId]);

    const fetchLevelData = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem("token");

            // 사용자 기본 정보
            let userName = targetUserId;
            let userLvIdx = 1;
            let profileData = null;

            // 공개 API 사용 (토큰 검증 없음)
            try {
                console.log("공개 API 호출:", `http://localhost:80/profile/public/${targetUserId}`);
                const response = await axios.get(`http://localhost:80/profile/public/${targetUserId}`);
                
                console.log("API 응답:", response.data);
                
                if (response.data.status === "success") {
                    const profile = response.data.profile;
                    const levelInfo = response.data.levelInfo;
                    
                    console.log("프로필 데이터:", profile);
                    console.log("레벨 정보:", levelInfo);
                    
                    profileData = profile; // 프로필 데이터 저장
                    if (profile.name) userName = profile.name;
                    if (levelInfo && typeof levelInfo.lv_idx === 'number') {
                        userLvIdx = levelInfo.lv_idx;
                        console.log("✅ 레벨 정보 찾음:", userLvIdx);
                    }
                }
            } catch (error) {
                console.error("공개 API 호출 실패:", error.response?.status, error.response?.data);
                
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
                
                alert("접근할 수 없는 사용자입니다.");
                router.push("/main");
                return;
            }

            console.log("최종 사용자 정보:", { name: userName, lv_idx: userLvIdx });

            // 차단/탈퇴 사용자 체크
            if (profileData?.block_yn === true || profileData?.block_yn === 1) {
                alert("차단된 사용자의 프로필은 조회할 수 없습니다.");
                router.push("/main");
                return;
            }
            
            if (profileData?.user_del_yn === true || profileData?.user_del_yn === 1) {
                alert("탈퇴한 사용자의 프로필은 조회할 수 없습니다.");
                router.push("/main");
                return;
            }

            // 프로필 API에서 차단/탈퇴 필드가 없는 경우
            if (!('block_yn' in profileData) || !('user_del_yn' in profileData)) {
                console.warn("⚠️ 프로필 API에서 차단/탈퇴 상태를 제공하지 않음");
                console.log("📝 차단/탈퇴 상태 필드가 없어도 프로필 조회는 허용합니다.");
                // 프로필 API가 성공적으로 응답했다면 접근 가능한 사용자로 간주
            }

            // profile_yn 체크 - 비공개 프로필인 경우 타인 접근 차단
            const currentUserId = sessionStorage.getItem("id");
            if (profileData?.profile_yn === false && currentUserId !== targetUserId) {
                alert("이 사용자는 프로필을 비공개로 설정했습니다.");
                router.back(); // 이전 페이지로 돌아가기
                return;
            }

            setUser({
                id: targetUserId,
                name: userName,
                lv_idx: userLvIdx,
                profile: profileData, // 프로필 데이터 추가
                profile_yn: profileData?.profile_yn || false
            });

            // 레벨 목록에서 해당 레벨 정보 찾기
            try {
                const levelRes = await axios.get("http://localhost:80/admin/level", {
                    headers: { Authorization: token }
                });

                const levels = Array.isArray(levelRes.data) ? levelRes.data : levelRes.data.result || [];
                console.log("🔍 전체 레벨 목록:", levels);
                console.log("🔍 찾고 있는 lv_idx:", userLvIdx, typeof userLvIdx);
                console.log("🔍 각 레벨의 lv_idx 타입:", levels.map(l => `${l.lv_idx}(${typeof l.lv_idx})`));
                
                // 🎯 타입 안전한 비교를 위해 숫자로 변환
                const userLevel = levels.find(level => Number(level.lv_idx) === Number(userLvIdx));
                console.log("🔍 찾은 레벨:", userLevel);
                
                if (userLevel) {
                    console.log("🎯 레벨 설정 시작 - userLevel:", userLevel);
                    console.log("🎯 설정할 lv_no:", userLevel.lv_no);
                    
                    setCurrentLevel(userLevel);
                    setUser(prev => {
                        const newUser = { 
                            ...prev, 
                            level: userLevel.lv_no  // lv_no를 사용 (관리자는 0)
                        };
                        console.log("🎯 새로운 user 상태:", newUser);
                        return newUser;
                    });
                    console.log("✅ 레벨 정보 설정 완료:", userLevel.lv_name, `(lv_no: ${userLevel.lv_no})`);
                } else {
                    console.log("❌ 해당 lv_idx에 맞는 레벨을 찾을 수 없음:", userLvIdx);
                    console.log("❌ 사용 가능한 lv_idx들:", levels.map(l => l.lv_idx));
                    
                    // 기본 레벨 1
                    const defaultLevel = levels.find(level => level.lv_idx === 1);
                    if (defaultLevel) {
                        setCurrentLevel(defaultLevel);
                        setUser(prev => ({ 
                            ...prev, 
                            level: defaultLevel.lv_no 
                        }));
                        console.log("⚠️ 기본 레벨 1 설정:", defaultLevel.lv_name);
                    }
                }
            } catch (error) {
                console.error("레벨 목록 로딩 실패:", error);
                // 토큰 오류 시 기본 레벨 정보 설정
                const defaultLevel = {
                    lv_idx: userLvIdx,
                    lv_no: userLvIdx === 7 ? 0 : userLvIdx === 1 ? 1 : userLvIdx === 2 ? 2 : userLvIdx, // 관리자(lv_idx:7)는 lv_no:0
                    lv_name: userLvIdx === 7 ? "관리자" : userLvIdx === 1 ? "진단의 시작" : userLvIdx === 2 ? "초보 환자" : `레벨 ${userLvIdx}`,
                    lv_icon: "/default-level-icon.png"
                };
                setCurrentLevel(defaultLevel);
                console.log("⚠️ 토큰 오류로 기본 레벨 정보 설정:", defaultLevel.lv_name, `(lv_no: ${defaultLevel.lv_no})`);
            }

        } catch (error) {
            console.error("전체 로딩 실패:", error);
            setError("레벨 정보를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
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

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="view-user-level">
            <div className="level-header-simple">
                <button className="back-button" onClick={() => router.push(`/profile/view/${targetUserId}`)}>
                    ← 프로필로 돌아가기
                </button>
                
                <div className="header-title">
                    <h2>{user?.name}님의 레벨 정보</h2>
                </div>
            </div>

            {/* 현재 레벨 섹션 */}
            <div className="current-level-section">
                <h3>현재 레벨</h3>
                <div className="level-card current">
                    <div className="level-info">
                        <div className="level-number">Lv.{currentLevel?.lv_no !== undefined ? currentLevel.lv_no : 1}</div>
                        <div className="level-name">{currentLevel?.lv_name || "새싹"}</div>
                    </div>
                    {currentLevel?.lv_icon && (
                        <div className="level-icon">
                            <img src={currentLevel.lv_icon} alt="레벨 아이콘" />
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
} 