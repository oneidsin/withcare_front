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
            const currentUserId = sessionStorage.getItem("id");

            // 공개 프로필 API로 프로필 정보와 배지 정보를 한 번에 가져오기
            let profileRes;
            try {
                console.log("공개 프로필 API 호출 (배지 포함):", `http://localhost:80/profile/public/${targetUserId}`);
                profileRes = await axios.get(`http://localhost:80/profile/public/${targetUserId}`);
                console.log("공개 프로필 API 응답:", profileRes.data);
            } catch (error) {
                console.error("공개 프로필 API 호출 실패:", error);
                setError("프로필 정보를 불러오는데 실패했습니다.");
                return;
            }

            // 응답 데이터 확인
            if (profileRes.data?.status !== "success") {
                console.error("API 응답 상태가 success가 아님:", profileRes.data?.status);
                console.error("전체 응답 데이터:", profileRes.data);
                setError("프로필 정보를 찾을 수 없습니다.");
                return;
            }

            // 사용자 정보 처리
            const userData = profileRes.data.profile;
            const badgeData = profileRes.data.badges || [];
            const mainBadgeData = profileRes.data.mainBadge;
            const badgeCount = profileRes.data.badgeCount || 0;

            console.log("=== API 응답 구조 분석 ===");
            console.log("전체 응답 키들:", Object.keys(profileRes.data));
            console.log("사용자 정보:", userData);
            console.log("배지 데이터:", badgeData);
            console.log("배지 데이터 타입:", typeof badgeData, "길이:", badgeData?.length);
            console.log("메인 배지:", mainBadgeData);
            console.log("배지 개수:", badgeCount);
            
            // 혹시 다른 필드명으로 배지 데이터가 있는지 확인
            console.log("=== 모든 응답 필드 확인 ===");
            for (const [key, value] of Object.entries(profileRes.data)) {
                console.log(`${key}:`, value);
                if (Array.isArray(value)) {
                    console.log(`  -> ${key}는 배열입니다. 길이: ${value.length}`);
                }
            }

            // 백엔드 구현 상태 진단
            console.log("=== 백엔드 구현 상태 진단 ===");
            console.log("🔍 확인사항:");
            console.log("1. ProfileController에 배지 서비스 주입 여부");
            console.log("2. ProfileService에 getPublicUserBadges 메서드 구현 여부");
            console.log("3. ProfileMapper.xml에 getPublicUserBadges 쿼리 추가 여부");
            console.log("4. 데이터베이스 user_badge 테이블에 실제 데이터 존재 여부");
            console.log("5. 공개 프로필 API에서 배지 서비스 호출 코드 누락 가능성");
            
            if (!profileRes.data.badges && !profileRes.data.badgeCount) {
                console.warn("⚠️ 공개 프로필 API가 배지 관련 필드를 전혀 반환하지 않습니다.");
                console.warn("   백엔드에서 배지 서비스 호출 코드가 누락되었을 가능성이 높습니다.");
            }

            // profile_yn 체크 - 비공개 프로필인 경우 타인 접근 차단
            if (userData?.profile_yn === false && currentUserId !== targetUserId) {
                alert("이 사용자는 프로필을 비공개로 설정했습니다.");
                router.back(); // 이전 페이지로 돌아가기
                return;
            }

            setUser({
                id: targetUserId,
                name: userData?.name || userData?.id || targetUserId,
                profile_image: userData?.profile_photo && userData?.profile_photo !== '' ?
                    `http://localhost:80/file/${userData?.profile_photo}` :
                    '/defaultProfileImg.png',
                introduction: userData?.intro || '소개글이 없습니다.',
                level: userData?.level || 1,
                main_badge_idx: userData?.main_badge_idx || null,
                profile_yn: userData?.profile_yn || false
            });

            // 배지 정보 처리
            if (Array.isArray(badgeData) && badgeData.length > 0) {
                console.log("✅ 공개 프로필 API에서 배지 데이터를 받았습니다");
                console.log("첫 번째 배지 샘플:", badgeData[0]);
                console.log("배지 데이터 필드들:", Object.keys(badgeData[0]));
                
                // 백엔드에서 받은 데이터 구조에 맞게 처리
                const processedBadges = badgeData.map(badge => ({
                    bdg_idx: Number(badge.bdg_idx) || badge.bdg_idx,
                    bdg_name: badge.bdg_name,
                    bdg_condition: badge.bdg_condition,
                    bdg_icon: badge.bdg_icon,
                    is_acquired: badge.is_acquired === 1 || badge.is_acquired === true,
                    bdg_sym_yn: badge.bdg_sym_yn === 1 || badge.bdg_sym_yn === true,
                    acquired_date: badge.acquired_date
                }));
                
                console.log("처리된 배지 데이터:", processedBadges);
                setUserBadges(processedBadges);

                // 메인 배지 설정
                if (mainBadgeData) {
                    const processedMainBadge = {
                        bdg_idx: Number(mainBadgeData.bdg_idx) || mainBadgeData.bdg_idx,
                        bdg_name: mainBadgeData.bdg_name,
                        bdg_condition: mainBadgeData.bdg_condition,
                        bdg_icon: mainBadgeData.bdg_icon,
                        is_acquired: mainBadgeData.is_acquired === 1 || mainBadgeData.is_acquired === true,
                        bdg_sym_yn: mainBadgeData.bdg_sym_yn === 1 || mainBadgeData.bdg_sym_yn === true,
                        acquired_date: mainBadgeData.acquired_date
                    };
                    setMainBadge(processedMainBadge);
                    console.log("메인 배지 설정:", processedMainBadge);
                } else {
                    // 메인 배지가 별도로 없으면 배지 목록에서 찾기
                    const mainBadgeFromList = processedBadges.find(badge => badge.bdg_sym_yn === true);
                    if (mainBadgeFromList) {
                        setMainBadge(mainBadgeFromList);
                        console.log("배지 목록에서 메인 배지 찾음:", mainBadgeFromList);
                    }
                }
                
                console.log(`배지 데이터 로드 완료. 획득한 배지 수: ${processedBadges.length}`);
            } else {
                console.log("⚠️ 공개 프로필 API에서 배지 데이터를 받지 못했습니다.");
                
                // 배지 데이터가 없는 경우에 대한 상세 분석
                console.log("=== 배지 데이터 부재 분석 ===");
                console.log("1. 백엔드 ProfileController에서 배지 서비스 호출 확인 필요");
                console.log("2. ProfileMapper.xml에 getPublicUserBadges 쿼리 추가 확인 필요");
                console.log("3. 데이터베이스 user_badge 테이블에서 해당 사용자 데이터 존재 확인 필요");
                console.log("4. 배지가 실제로 없는 경우일 수도 있음");
                
                // 본인인 경우에만 토큰 기반 API로 한 번 더 확인
                if (currentUserId === targetUserId && token) {
                    console.log("본인 프로필이므로 토큰 기반 API로 배지 확인 시도");
                    try {
                        const userBadgesRes = await axios.get(`http://localhost:80/${targetUserId}/badge/list`, {
                            headers: { Authorization: token }
                        });
                        
                        if (userBadgesRes.data?.result && Array.isArray(userBadgesRes.data.result)) {
                            const tokenBadges = userBadgesRes.data.result.filter(badge => 
                                badge.is_acquired === 1 || badge.is_acquired === true
                            );
                            
                            if (tokenBadges.length > 0) {
                                console.log("🎯 토큰 기반 API에서 배지를 찾았습니다!", tokenBadges);
                                console.log("💡 이는 공개 프로필 API에 배지 데이터가 포함되지 않았음을 의미합니다.");
                                
                                const processedBadges = tokenBadges.map(badge => ({
                                    bdg_idx: Number(badge.bdg_idx) || badge.bdg_idx,
                                    bdg_name: badge.bdg_name,
                                    bdg_condition: badge.bdg_condition,
                                    bdg_icon: badge.bdg_icon,
                                    is_acquired: true,
                                    bdg_sym_yn: badge.bdg_sym_yn === 1 || badge.bdg_sym_yn === true,
                                    acquired_date: badge.acquired_date
                                }));
                                
                                setUserBadges(processedBadges);
                                
                                const mainBadge = processedBadges.find(badge => badge.bdg_sym_yn === true);
                                if (mainBadge) {
                                    setMainBadge(mainBadge);
                                }
                                
                                console.log(`토큰 API로 배지 로드 완료. 획득한 배지 수: ${processedBadges.length}`);
                            } else {
                                console.log("토큰 API에서도 획득한 배지가 없습니다.");
                                setUserBadges([]);
                                setMainBadge(null);
                            }
                        }
                    } catch (apiError) {
                        console.log("토큰 기반 배지 API 호출 실패:", apiError.message);
                        setUserBadges([]);
                        setMainBadge(null);
                    }
                } else {
                    // 타인의 프로필인 경우 배지 데이터가 없으면 빈 상태로 설정
                    console.log("타인의 프로필이고 공개 배지 데이터가 없습니다.");
                    setUserBadges([]);
                    setMainBadge(null);
                }
            }

        } catch (error) {
            console.error("배지 데이터 로딩 실패:", error);
            setError("배지 정보를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 배지 아이콘 URL 생성 (백엔드 구조에 맞게)
    const getBadgeIconUrl = (badge) => {
        const icon = badge?.bdg_icon;
        
        if (!icon || icon === 'null' || icon === 'undefined' || icon === '') {
            return "/defaultBadge.png";
        }
        
        if (icon.startsWith('http://') || icon.startsWith('https://')) {
            return icon;
        }
        
        // 백엔드 파일 서버 경로 사용
        if (icon.startsWith('badge/')) {
            return `http://localhost:80/file/${icon}`;
        }
        
        // 기본적으로 배지 폴더로 처리
        return `http://localhost:80/file/badge/${icon}`;
    };

    if (loading) return (
        <div className="view-user-badge">
            <div className="loading">배지 정보를 불러오는 중...</div>
        </div>
    );
    
    if (error) return (
        <div className="view-user-badge">
            <div className="error-message">{error}</div>
        </div>
    );

    return (
        <div className="view-user-badge">
            <div className="badge-header-simple">
                <button className="back-button" onClick={() => router.push(`/profile/view/${targetUserId}`)}>
                    ← 프로필로 돌아가기
                </button>
                
                <div className="header-title">
                    <h2>{user?.name}님의 배지 정보</h2>
                </div>
            </div>

            {/* 메인 배지 섹션 */}
            {mainBadge && (
                <div className="main-badge-section">
                    <h3>메인 배지</h3>
                    <div className="badge-card main">
                        <div className="badge-icon">
                            <img 
                                src={getBadgeIconUrl(mainBadge)} 
                                alt={mainBadge.bdg_name}
                                onError={(e) => { 
                                    e.target.onerror = null; 
                                    e.target.src = "/defaultBadge.png";
                                }}
                            />
                        </div>
                        <div className="badge-info">
                            <div className="badge-name">{mainBadge.bdg_name}</div>
                            <div className="badge-description">{mainBadge.bdg_condition}</div>
                            <div className="main-badge-status">메인 배지</div>
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
                            <div key={badge.bdg_idx} className="badge-item earned">
                                <div className="badge-icon">
                                    <img 
                                        src={getBadgeIconUrl(badge)} 
                                        alt={badge.bdg_name}
                                        onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = "/defaultBadge.png";
                                        }}
                                    />
                                </div>
                                <div className="badge-name">{badge.bdg_name}</div>
                                <div className="badge-description">{badge.bdg_condition}</div>
                                {badge.bdg_sym_yn && (
                                    <div className="main-badge-indicator">메인 배지</div>
                                )}
                                {badge.acquired_date && (
                                    <div className="acquired-date">획득일: {badge.acquired_date}</div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-message">
                            <p>획득한 배지가 없습니다.</p>
                            <p>활동을 통해 배지를 획득해보세요!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 