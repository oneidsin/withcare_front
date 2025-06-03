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

            // 2. 전체 배지 목록 조회 (사용자별 배지 API 사용)
            let allBadges = [];

            // 1. 전체 배지 목록 조회 (사용자별 배지 API 사용)
            try {
                console.log('배지 목록 조회 시작...');
                
                const badgesResponse = await axios.get(`${API_BASE_URL}/${targetUserId}/badge/list`, {
                    headers: { Authorization: token }
                });

                if (badgesResponse.data.result) {
                    allBadges = badgesResponse.data.result || [];
                    console.log('배지 목록 조회 성공:', allBadges.length, '개');
                } else {
                    console.log('배지 목록 조회 실패:', badgesResponse.data);
                    allBadges = [];
                }
            } catch (badgeError) {
                console.log('배지 목록 조회 실패:', badgeError.response?.data || badgeError.message);
                // 오류 시에도 빈 배열로 설정하여 계속 진행
                allBadges = [];
            }

            setBadges(allBadges);

            // 2. 백엔드에서 이미 획득 정보를 포함해서 보내주므로 별도 처리
            if (allBadges.length > 0) {
                // 획득한 배지들 필터링
                const acquiredBadges = allBadges
                    .filter(badge => badge.is_acquired)
                    .map(badge => ({
                        bdg_idx: badge.bdg_idx,
                        acquired_date: new Date().toISOString() // 백엔드에서 날짜를 제공하지 않으므로 현재 날짜 사용
                    }));

                setUserBadges(acquiredBadges);

                // 대표 배지 설정 (bdg_sym_yn이 true인 배지)
                const mainBadgeInfo = allBadges.find(badge => badge.bdg_sym_yn);
                if (mainBadgeInfo) {
                    setMainBadge(mainBadgeInfo.bdg_idx);
                    console.log('대표 배지 설정:', mainBadgeInfo.bdg_idx, mainBadgeInfo.bdg_name);
                } else {
                    setMainBadge(null);
                    console.log('설정된 대표 배지 없음');
                }

                console.log('배지 데이터 처리 완료:');
                console.log('- 전체 배지:', allBadges.length, '개');
                console.log('- 획득한 배지:', acquiredBadges.length, '개');
                console.log('- 대표 배지:', mainBadgeInfo ? mainBadgeInfo.bdg_name : '없음');
            } else {
                setUserBadges([]);
                setMainBadge(null);
                console.log('배지 데이터 없음');
            }

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

    // 배지 획득 여부 확인
    const isBadgeAcquired = (badgeIdx) => {
        return badges.some(badge => badge.bdg_idx === badgeIdx && badge.is_acquired);
    };

    // 메인 배지 여부 확인
    const isMainBadge = (badgeIdx) => {
        const badge = badges.find(b => b.bdg_idx === badgeIdx);
        return badge && badge.bdg_sym_yn;
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
    const acquiredBadges = badges.filter(badge => badge.is_acquired);
    
    // 미획득 배지들
    const unacquiredBadges = badges.filter(badge => !badge.is_acquired);

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