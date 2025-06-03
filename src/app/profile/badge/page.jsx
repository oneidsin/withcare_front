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

            // 1. 전체 배지 목록 조회 (레벨과 동일한 방식)
            // 백엔드 수정 필요: svc.userLevel(loginId) != 7 조건 제거
            try {
                console.log('배지 목록 조회 시작...');
                const badgesResponse = await axios.get(`${API_BASE_URL}/admin/bdg/list`, {
                    headers: { Authorization: token }
                });

                if (badgesResponse.data.success) {
                    allBadges = badgesResponse.data.badges || [];
                    console.log('배지 목록 조회 성공:', allBadges.length, '개');
                } else {
                    console.error('배지 목록 조회 실패:', badgesResponse.data);
                    allBadges = [];
                }
            } catch (badgeError) {
                console.error('배지 목록 조회 중 오류:', badgeError);
                // 레벨 페이지와 동일하게 빈 배열로 설정
                allBadges = [];
            }

            setBadges(allBadges);

            // 2. 사용자 획득 배지 정보 조회 (가상의 API - 실제로는 백엔드에서 구현 필요)
            // 현재 API가 구현되지 않았으므로 바로 데모 데이터 사용
            console.log('사용자 배지 API 아직 구현되지 않음, 데모 데이터 사용');
            simulateUserBadges(allBadges);

            // 실제 백엔드 API 구현 후 아래 주석을 해제하고 사용
            /*
            try {
                const userBadgesResponse = await axios.get(`${API_BASE_URL}/profile/badges/${userId}`, {
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
            setError('배지 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 임시 데모 데이터 (실제 API 구현 전까지)
    const simulateUserBadges = (allBadges) => {
        const userId = sessionStorage.getItem('id');
        const loginId = sessionStorage.getItem('loginId');
        
        console.log('=== 배지 데이터 로딩 디버깅 ===');
        console.log('세션 스토리지 정보:', {
            userId: userId,
            loginId: loginId,
            userIdType: typeof userId,
            loginIdType: typeof loginId
        });
        
        // 사용자 ID가 없으면 처리 중단
        if (!userId) {
            console.error('사용자 ID가 없습니다!');
            return;
        }
        
        const userBadgesKey = `userBadges_${userId}`;
        const mainBadgeKey = `mainBadge_${userId}`;
        
        console.log('로컬 스토리지 키:', {
            userBadgesKey: userBadgesKey,
            mainBadgeKey: mainBadgeKey
        });
        
        if (allBadges.length > 0) {
            // 로컬 스토리지에서 획득한 배지 목록 불러오기
            const savedUserBadges = localStorage.getItem(userBadgesKey);
            console.log('저장된 배지 데이터:', savedUserBadges);
            
            let acquiredBadges = [];

            if (savedUserBadges) {
                // 저장된 배지 목록이 있으면 사용
                try {
                    acquiredBadges = JSON.parse(savedUserBadges);
                    console.log('기존 획득한 배지 목록 복원:', acquiredBadges.length, '개', acquiredBadges);
                    
                    // 배지 데이터 유효성 검증 (존재하는 배지만 유지)
                    const validBadges = acquiredBadges.filter(userBadge => 
                        allBadges.some(badge => badge.bdg_idx === userBadge.bdg_idx)
                    );
                    
                    if (validBadges.length !== acquiredBadges.length) {
                        console.log('유효하지 않은 배지 제거:', acquiredBadges.length - validBadges.length, '개');
                        acquiredBadges = validBadges;
                        localStorage.setItem(userBadgesKey, JSON.stringify(acquiredBadges));
                    }
                    
                } catch (error) {
                    console.error('배지 목록 파싱 실패:', error);
                    // 파싱 실패 시 빈 배열로 설정 (새 사용자와 동일)
                    acquiredBadges = [];
                }
            } else {
                // 저장된 배지 목록이 없으면 새 사용자이므로 빈 배열
                console.log('새 사용자 - 배지 없음');
                acquiredBadges = [];
            }
            
            setUserBadges(acquiredBadges);
            
            // 로컬 스토리지에서 메인 배지 불러오기
            const savedMainBadge = localStorage.getItem(mainBadgeKey);
            console.log('저장된 메인 배지:', savedMainBadge);
            
            if (savedMainBadge && acquiredBadges.length > 0) {
                const mainBadgeIdx = parseInt(savedMainBadge);
                console.log('메인 배지 인덱스 파싱:', mainBadgeIdx);
                
                // 숫자가 아니거나 유효하지 않은 값인 경우 제거
                if (isNaN(mainBadgeIdx) || mainBadgeIdx <= 0) {
                    console.log('잘못된 메인 배지 값 제거:', savedMainBadge);
                    setMainBadge(null);
                    localStorage.removeItem(mainBadgeKey);
                    return;
                }
                
                // 저장된 메인 배지가 획득한 배지 중에 있고, 실제 배지 목록에도 존재하는지 확인
                const isValidMainBadge = acquiredBadges.some(badge => badge.bdg_idx === mainBadgeIdx) &&
                                       allBadges.some(badge => badge.bdg_idx === mainBadgeIdx);
                                       
                if (isValidMainBadge) {
                    setMainBadge(mainBadgeIdx);
                    console.log('메인 배지 복원 성공:', mainBadgeIdx);
                } else {
                    // 저장된 메인 배지가 유효하지 않으면 메인 배지 없음으로 설정
                    console.log('메인 배지 유효하지 않음, 제거:', mainBadgeIdx);
                    setMainBadge(null);
                    localStorage.removeItem(mainBadgeKey);
                }
            } else {
                // 메인 배지가 저장되지 않았거나 획득한 배지가 없으면 메인 배지 없음
                console.log('메인 배지 없음 상태 - 획득배지:', acquiredBadges.length, '개');
                setMainBadge(null);
                // 혹시 잘못된 메인 배지 정보가 있으면 제거
                if (savedMainBadge) {
                    console.log('잘못된 메인 배지 정보 제거:', savedMainBadge);
                    localStorage.removeItem(mainBadgeKey);
                }
            }
        }
        
        console.log('=== 배지 데이터 로딩 완료 ===');
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

            // 현재 API가 구현되지 않았으므로 로컬 상태만 업데이트
            // 실제 백엔드 API 구현 후 아래 주석을 해제하고 사용
            /*
            const response = await axios.post(`${API_BASE_URL}/profile/badges/main`, {
                userId: userId,
                badgeIdx: badgeIdx
            }, {
                headers: { Authorization: token }
            });

            if (response.data.success) {
                setMainBadge(badgeIdx);
                // 로컬 스토리지에 메인 배지 저장
                localStorage.setItem(`mainBadge_${userId}`, badgeIdx.toString());
                alert('메인 배지가 설정되었습니다.');
            } else {
                throw new Error('메인 배지 설정 실패');
            }
            */

            // 임시로 로컬 상태만 업데이트 (API 구현 전까지)
            console.log('메인 배지 설정:', {
                userId: userId,
                badgeIdx: badgeIdx,
                badgeName: selectedBadge.bdg_name
            });
            
            setMainBadge(badgeIdx);
            
            // 로컬 스토리지에 메인 배지 저장 (숫자를 문자열로 변환하여 저장)
            localStorage.setItem(`mainBadge_${userId}`, badgeIdx.toString());
            console.log('메인 배지 로컬 스토리지에 저장:', `mainBadge_${userId}`, badgeIdx);
            
            alert('메인 배지가 설정되었습니다.');

        } catch (error) {
            console.error('메인 배지 설정 실패:', error);
            alert('메인 배지 설정에 실패했습니다.');
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
            const userId = sessionStorage.getItem('id');
            
            if (!userId) {
                alert('로그인 정보가 없습니다.');
                return;
            }

            // 현재 API가 구현되지 않았으므로 로컬 상태만 업데이트
            // 실제 백엔드 API 구현 후 아래 주석을 해제하고 사용
            /*
            const response = await axios.post(`${API_BASE_URL}/profile/badges/acquire`, {
                userId: userId,
                badgeIdx: badgeIdx
            }, {
                headers: { Authorization: token }
            });

            if (response.data.success) {
                // 서버 응답 처리
            } else {
                throw new Error('배지 획득 실패');
            }
            */

            // 임시로 로컬 상태만 업데이트 (API 구현 전까지)
            console.log('배지 획득:', {
                userId: userId,
                badgeIdx: badgeIdx,
                badgeName: selectedBadge.bdg_name
            });
            
            // 새로운 배지를 userBadges에 추가
            const newUserBadge = {
                bdg_idx: badgeIdx,
                acquired_date: new Date().toISOString()
            };
            
            const updatedUserBadges = [...userBadges, newUserBadge];
            setUserBadges(updatedUserBadges);

            // 로컬 스토리지에 획득한 배지 목록 저장
            const userBadgesKey = `userBadges_${userId}`;
            localStorage.setItem(userBadgesKey, JSON.stringify(updatedUserBadges));
            console.log('배지 목록 로컬 스토리지에 저장:', userBadgesKey);

            // 만약 첫 번째 배지라면 메인 배지로 설정
            if (updatedUserBadges.length === 1) {
                setMainBadge(badgeIdx);
                const mainBadgeKey = `mainBadge_${userId}`;
                localStorage.setItem(mainBadgeKey, badgeIdx.toString());
                console.log('첫 번째 배지를 메인 배지로 설정:', mainBadgeKey, badgeIdx);
            }

            alert(`"${selectedBadge.bdg_name}" 배지를 획득했습니다! 🎉`);

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
    const acquiredBadges = badges.filter(badge => isBadgeAcquired(badge.bdg_idx) && badge.bdg_active_yn);
    
    // 미획득 배지들
    const unacquiredBadges = badges.filter(badge => !isBadgeAcquired(badge.bdg_idx) && badge.bdg_active_yn);

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