"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import '../../badge/badge.css';

const API_BASE_URL = 'http://localhost:80';

export default function ViewUserBadge() {
    const params = useParams();
    const router = useRouter();
    const targetUserId = params.id;
    
    const [badges, setBadges] = useState([]);
    const [userBadges, setUserBadges] = useState([]);
    const [mainBadge, setMainBadge] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 배지 이미지 URL 처리 함수
    const getBadgeImageUrl = (iconPath) => {
        if (!iconPath) return '/defaultProfileImg.png';
        
        if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
            return iconPath;
        }
        
        if (iconPath.startsWith('badge/')) {
            return `http://localhost:80/file/${iconPath}`;
        }
        
        return `http://localhost:80/file/badge/${iconPath}`;
    };

    // 컴포넌트 마운트 시 데이터 로딩
    useEffect(() => {
        const currentUserId = sessionStorage.getItem('id');
        
        // 자신의 프로필에 접근하려는 경우 내 프로필로 리다이렉트
        if (currentUserId && currentUserId === targetUserId) {
            router.push('/profile/badge');
            return;
        }
        
        loadUserBadges();
    }, [targetUserId, router]);

    // 사용자 배지 정보 로딩
    const loadUserBadges = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            
            if (!token) {
                setError('로그인이 필요합니다.');
                return;
            }

            // 1. 타겟 사용자 정보 조회
            const userInfoResponse = await axios.get(`${API_BASE_URL}/profile/activity/${targetUserId}`, {
                headers: { Authorization: token }
            });

            if (!userInfoResponse.data.success) {
                throw new Error('사용자 정보 조회 실패');
            }

            setUserInfo(userInfoResponse.data.user);

            // 2. 전체 배지 목록 조회
            const badgesResponse = await axios.get(`${API_BASE_URL}/admin/bdg/list`, {
                headers: { Authorization: token }
            });

            if (!badgesResponse.data.success) {
                throw new Error('배지 목록 조회 실패');
            }

            const allBadges = badgesResponse.data.badges || [];
            setBadges(allBadges);

            // 3. 해당 사용자의 획득 배지 정보 조회 (가상의 API)
            // 현재 API가 구현되지 않았으므로 바로 데모 데이터 사용
            console.log('사용자 배지 API 아직 구현되지 않음, 데모 데이터 사용');
            simulateUserBadges(allBadges);

            // 실제 백엔드 API 구현 후 아래 주석을 해제하고 사용
            /*
            try {
                const userBadgesResponse = await axios.get(`${API_BASE_URL}/profile/badges/${targetUserId}`, {
                    headers: { Authorization: token }
                });

                if (userBadgesResponse.data.success) {
                    setUserBadges(userBadgesResponse.data.userBadges || []);
                    setMainBadge(userBadgesResponse.data.mainBadge || null);
                } else {
                    // API가 없는 경우 임시로 몇 개 배지를 획득한 것으로 시뮬레이션
                    console.log('사용자 배지 API 없음, 데모 데이터 사용');
                    simulateUserBadges(allBadges);
                }
            } catch (error) {
                // API가 없는 경우 임시로 데모 데이터 사용
                console.log('사용자 배지 API 없음, 데모 데이터 사용');
                simulateUserBadges(allBadges);
            }
            */

        } catch (error) {
            console.error('배지 정보 로딩 실패:', error);
            if (error.response?.status === 404) {
                setError('사용자를 찾을 수 없습니다.');
            } else {
                setError('배지 정보를 불러오는데 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    // 임시 데모 데이터 (실제 API 구현 전까지)
    const simulateUserBadges = (allBadges) => {
        if (allBadges.length > 0) {
            // 사용자 ID를 기반으로 일관된 배지 할당
            const userIdNum = parseInt(targetUserId) || 1;
            const numBadges = Math.min(2 + (userIdNum % 3), allBadges.length); // 2-4개 배지
            
            const acquiredBadges = allBadges.slice(0, numBadges).map(badge => ({
                bdg_idx: badge.bdg_idx,
                acquired_date: new Date().toISOString()
            }));
            
            setUserBadges(acquiredBadges);
            
            // 해당 사용자의 메인 배지를 로컬 스토리지에서 불러오기
            const savedMainBadge = sessionStorage.getItem(`mainBadge_${targetUserId}`);
            if (savedMainBadge) {
                const mainBadgeIdx = parseInt(savedMainBadge);
                // 저장된 메인 배지가 획득한 배지 중에 있는지 확인
                const isValidMainBadge = acquiredBadges.some(badge => badge.bdg_idx === mainBadgeIdx);
                if (isValidMainBadge) {
                    setMainBadge(mainBadgeIdx);
                } else {
                    // 저장된 메인 배지가 더 이상 유효하지 않으면 첫 번째 배지로 설정
                    const firstBadgeIdx = acquiredBadges[0].bdg_idx;
                    setMainBadge(firstBadgeIdx);
                    localStorage.setItem(`mainBadge_${targetUserId}`, firstBadgeIdx.toString());
                }
            } else {
                // 저장된 메인 배지가 없으면 첫 번째 획득 배지를 메인 배지로 설정
                if (acquiredBadges.length > 0) {
                    const firstBadgeIdx = acquiredBadges[0].bdg_idx;
                    setMainBadge(firstBadgeIdx);
                    localStorage.setItem(`mainBadge_${targetUserId}`, firstBadgeIdx.toString());
                }
            }
        }
    };

    // 배지 획득 여부 확인
    const isBadgeAcquired = (badgeIdx) => {
        return userBadges.some(userBadge => userBadge.bdg_idx === badgeIdx);
    };

    // 메인 배지 여부 확인
    const isMainBadge = (badgeIdx) => {
        return mainBadge === badgeIdx;
    };

    // 뒤로가기
    const handleGoBack = () => {
        router.push(`/profile/view/${targetUserId}`);
    };

    // 로딩 중
    if (loading) {
        return (
            <div className="profile-badge-container">
                <div className="view-profile-header">
                    <button onClick={handleGoBack} className="back-button">
                        ← 뒤로가기
                    </button>
                    <h1 className="badge-title">배지</h1>
                </div>
                <div className="loading">배지 정보를 불러오는 중...</div>
            </div>
        );
    }

    // 에러 발생
    if (error) {
        return (
            <div className="profile-badge-container">
                <div className="view-profile-header">
                    <button onClick={handleGoBack} className="back-button">
                        ← 뒤로가기
                    </button>
                    <h1 className="badge-title">배지</h1>
                </div>
                <div className="error-message">{error}</div>
            </div>
        );
    }

    // 획득한 배지들
    const acquiredBadges = badges.filter(badge => isBadgeAcquired(badge.bdg_idx) && badge.bdg_active_yn);
    
    // 미획득 배지들
    const unacquiredBadges = badges.filter(badge => !isBadgeAcquired(badge.bdg_idx) && badge.bdg_active_yn);

    return (
        <div className="profile-badge-container">
            <div className="view-profile-header">
                <button onClick={handleGoBack} className="back-button">
                    ← 뒤로가기
                </button>
                <h1 className="badge-title">
                    {userInfo ? `${userInfo.name}님의 배지` : '배지'}
                </h1>
            </div>
            
            {/* 메인 배지 섹션 */}
            {mainBadge && (
                <div className="main-badge-section">
                    <div className="main-badge-display">
                        {(() => {
                            const mainBadgeInfo = badges.find(badge => badge.bdg_idx === mainBadge);
                            return mainBadgeInfo ? (
                                <div className="main-badge-item">
                                    <img 
                                        src={getBadgeImageUrl(mainBadgeInfo.bdg_icon)} 
                                        alt={mainBadgeInfo.bdg_name} 
                                        className="main-badge-icon"
                                        onError={(e) => { e.target.src = '/defaultProfileImg.png'; }}
                                    />
                                    <div className="main-badge-details">
                                        <div className="main-badge-text">
                                            <h3>메인 배지: {mainBadgeInfo.bdg_name}</h3>
                                            <h4>{mainBadgeInfo.bdg_condition}</h4>
                                        </div>
                                        <div className="badge-stats-inline">
                                            <div className="stat-item">
                                                <span>획득한 배지 {acquiredBadges.length}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span>전체 배지 {badges.filter(b => b.bdg_active_yn).length}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span>달성률 {badges.filter(b => b.bdg_active_yn).length > 0 
                                                    ? Math.round((acquiredBadges.length / badges.filter(b => b.bdg_active_yn).length) * 100) 
                                                    : 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </div>
            )}

            {/* 획득한 배지들 */}
            <div className="badge-section">
                <h2 className="section-title">
                    획득한 배지 ({acquiredBadges.length})
                </h2>
                {acquiredBadges.length > 0 ? (
                    <div className="badge-grid">
                        {acquiredBadges.map(badge => (
                            <div 
                                key={badge.bdg_idx} 
                                className={`badge-item acquired readonly ${isMainBadge(badge.bdg_idx) ? 'main-badge' : ''}`}
                            >
                                <img 
                                    src={getBadgeImageUrl(badge.bdg_icon)} 
                                    alt={badge.bdg_name} 
                                    className="badge-icon"
                                    onError={(e) => { e.target.src = '/defaultProfileImg.png'; }}
                                />
                                <div className="badge-info">
                                    <p className="badge-name">{badge.bdg_name}</p>
                                    <p className="badge-condition">{badge.bdg_condition}</p>
                                    {isMainBadge(badge.bdg_idx) && (
                                        <div className="main-badge-indicator">메인 배지</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-message">
                        <p>아직 획득한 배지가 없습니다.</p>
                    </div>
                )}
            </div>

            {/* 미획득 배지들 */}
            <div className="badge-section">
                <h2 className="section-title">
                    미획득 배지 ({unacquiredBadges.length})
                </h2>
                {unacquiredBadges.length > 0 ? (
                    <div className="badge-grid">
                        {unacquiredBadges.map(badge => (
                            <div 
                                key={badge.bdg_idx} 
                                className="badge-item unacquired readonly"
                            >
                                <img 
                                    src={getBadgeImageUrl(badge.bdg_icon)} 
                                    alt={badge.bdg_name} 
                                    className="badge-icon"
                                    onError={(e) => { e.target.src = '/defaultProfileImg.png'; }}
                                />
                                <div className="badge-info">
                                    <p className="badge-name">{badge.bdg_name}</p>
                                    <p className="badge-condition">{badge.bdg_condition}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-message">
                        <p>모든 배지를 획득했습니다! 🎉</p>
                    </div>
                )}
            </div>
        </div>
    );
} 