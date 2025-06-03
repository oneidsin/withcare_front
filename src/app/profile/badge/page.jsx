"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import './badge.css';

const API_BASE_URL = 'http://localhost:80';

export default function ProfileBadge() {
    const [badges, setBadges] = useState([]);
    const [userBadges, setUserBadges] = useState([]);
    const [mainBadge, setMainBadge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 배지 이미지 URL 처리 함수
    const getBadgeImageUrl = (iconPath) => {
        if (!iconPath) return '/defaultProfileImg.png';
        
        // 이미 완전한 URL인 경우
        if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
            return iconPath;
        }
        
        // 상대 경로인 경우 백엔드 파일 서버 URL 추가
        if (iconPath.startsWith('badge/')) {
            return `http://localhost:80/file/${iconPath}`;
        }
        
        // 기본적으로 백엔드 파일 서버 경로 추가
        return `http://localhost:80/file/badge/${iconPath}`;
    };

    // 컴포넌트 마운트 시 데이터 로딩
    useEffect(() => {
        loadUserBadges();
    }, []);

    // 사용자 배지 정보 로딩
    const loadUserBadges = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const userId = sessionStorage.getItem('id');
            
            if (!token || !userId) {
                setError('로그인이 필요합니다.');
                return;
            }

            let allBadges = [];

            // 1. 전체 배지 목록 조회 (사용자별 배지 API 사용)
            try {
                console.log('배지 목록 조회 시작...');
                
                const badgesResponse = await axios.get(`${API_BASE_URL}/${userId}/badge/list`, {
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
            setError('배지 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 메인 배지 설정
    const handleSetMainBadge = async (badgeIdx) => {
        // badgeIdx가 숫자가 아니면 처리하지 않음
        if (typeof badgeIdx !== 'number' || isNaN(badgeIdx) || badgeIdx <= 0) {
            console.error('잘못된 배지 인덱스:', badgeIdx);
            return;
        }

        // 현재 메인 배지와 동일한 배지를 클릭한 경우
        if (mainBadge === badgeIdx) {
            return;
        }

        // 배지 정보 찾기
        const selectedBadge = badges.find(badge => badge.bdg_idx === badgeIdx);
        if (!selectedBadge) {
            alert('배지 정보를 찾을 수 없습니다.');
            return;
        }

        // 실제로 획득한 배지인지 확인
        if (!isBadgeAcquired(badgeIdx)) {
            alert('획득하지 않은 배지는 메인 배지로 설정할 수 없습니다.');
            return;
        }

        // 확인 메시지 표시
        const confirmed = confirm(`"${selectedBadge.bdg_name}" 배지를 메인 배지로 설정하시겠습니까?`);
        if (!confirmed) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const userId = sessionStorage.getItem('id');

            if (!userId) {
                alert('로그인 정보가 없습니다.');
                return;
            }

            // 백엔드 API 호출
            const response = await axios.put(`${API_BASE_URL}/${userId}/badge/sym_yn/${badgeIdx}`, {}, {
                headers: { Authorization: token }
            });

            if (response.data.result) {
                setMainBadge(badgeIdx);
                alert('메인 배지가 설정되었습니다.');
                // 배지 목록 새로고침
                loadUserBadges();
            } else {
                alert('메인 배지 설정에 실패했습니다.');
            }
        } catch (error) {
            console.error('메인 배지 설정 실패:', error);
            alert('메인 배지 설정에 실패했습니다.');
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

    // 배지 획득 처리
    const handleAcquireBadge = async (badgeIdx) => {
        // 배지 정보 찾기
        const selectedBadge = badges.find(badge => badge.bdg_idx === badgeIdx);
        if (!selectedBadge) {
            alert('배지 정보를 찾을 수 없습니다.');
            return;
        }

        // 확인 메시지 표시
        const confirmed = confirm(`"${selectedBadge.bdg_name}" 배지 조건에 일치하셨나요?\n\n조건: ${selectedBadge.bdg_condition}`);
        if (!confirmed) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const userId = sessionStorage.getItem('id');
            
            if (!userId) {
                alert('로그인 정보가 없습니다.');
                return;
            }

            // 백엔드 API 호출
            const response = await axios.get(`${API_BASE_URL}/${userId}/badge/acquired/${badgeIdx}`, {
                headers: { Authorization: token }
            });

            if (response.data.result) {
                alert(`"${selectedBadge.bdg_name}" 배지를 획득했습니다! 🎉`);
                // 배지 목록 새로고침
                loadUserBadges();
            } else {
                alert('배지 획득에 실패했습니다.');
            }
        } catch (error) {
            console.error('배지 획득 실패:', error);
            alert('배지 획득에 실패했습니다.');
        }
    };

    // 로딩 중
    if (loading) {
        return (
            <div className="profile-badge-container">
                <h1 className="badge-title">내 배지</h1>
                <div className="loading">배지 정보를 불러오는 중...</div>
            </div>
        );
    }

    // 에러 발생
    if (error) {
    return (
            <div className="profile-badge-container">
                <h1 className="badge-title">내 배지</h1>
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
            <h1 className="badge-title">내 배지</h1>
            
            {/* 배지가 없는 경우 */}
            {badges.length === 0 ? (
                <div className="empty-message">
                    <p>등록된 배지가 없습니다.</p>
                    <p>관리자가 배지를 등록하면 여기에 표시됩니다.</p>
                </div>
            ) : (
                <>
                    {/* 메인 배지 섹션 */}
                    <div className="main-badge-section">
                        <div className="main-badge-display">
                            {(() => {
                                // 메인 배지가 설정되어 있고, 해당 배지 정보를 찾을 수 있고, 획득한 배지인지 확인
                                if (mainBadge) {
                                    const mainBadgeInfo = badges.find(badge => badge.bdg_idx === mainBadge);
                                    const isAcquired = isBadgeAcquired(mainBadge);
                                    
                                    if (mainBadgeInfo && isAcquired) {
                                        return (
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
                                                            <span>전체 배지 {badges.length}</span>
                                                        </div>
                                                        <div className="stat-item">
                                                            <span>달성률 {badges.length > 0 
                                                                ? Math.round((acquiredBadges.length / badges.length) * 100) 
                                                                : 0}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                                
                                // 메인 배지가 없거나 유효하지 않은 경우
                                return (
                                    <div className="main-badge-item">
                                        <img 
                                            src="/defaultProfileImg.png" 
                                            alt="메인 배지 없음" 
                                            className="main-badge-icon"
                                        />
                                        <div className="main-badge-details">
                                            <div className="main-badge-text">
                                                <h3>메인 배지가 없습니다</h3>
                                                <h4>배지를 획득하여 메인 배지로 설정해보세요!</h4>
                                            </div>
                                            <div className="badge-stats-inline">
                                                <div className="stat-item">
                                                    <span>획득한 배지 {acquiredBadges.length}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span>전체 배지 {badges.length}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span>달성률 {badges.length > 0 
                                                        ? Math.round((acquiredBadges.length / badges.length) * 100) 
                                                        : 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

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
                                        className={`badge-item acquired ${isMainBadge(badge.bdg_idx) ? 'main-badge' : ''}`}
                                        onClick={() => handleSetMainBadge(badge.bdg_idx)}
                                        title={isMainBadge(badge.bdg_idx) ? "현재 메인 배지입니다" : "클릭하여 메인 배지로 설정"}
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
                                <p>활동을 통해 배지를 획득해보세요!</p>
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
                                        className="badge-item unacquired"
                                        onClick={() => handleAcquireBadge(badge.bdg_idx)}
                                        title="클릭하여 배지 획득"
                                        style={{ cursor: 'pointer' }}
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
                </>
            )}
        </div>
    );
}