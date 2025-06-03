'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import '../../level/level.css';

export default function ViewProfileLevelPage() {
    const { id } = useParams();
    const router = useRouter();
    const [levels, setLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [currentUserLevel, setCurrentUserLevel] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);
    const [targetUserIsAdmin, setTargetUserIsAdmin] = useState(false);

    const fetchLevels = async () => {
        try {
            const token = sessionStorage.getItem('token');
            
            // 레벨 목록 조회 (admin API 사용)
            const res = await axios.get('http://localhost:80/admin/level', {
                headers: { Authorization: token }
            });

            if (res.data && Array.isArray(res.data)) {
                setLevels(res.data);
            } else if (res.data && res.data.result && Array.isArray(res.data.result)) {
                setLevels(res.data.result);
            } else {
                setLevels([]);
            }
        } catch (error) {
            console.error('Error fetching levels:', error);
            setLevels([]);
        }
    };

    const checkTargetUserAdminStatus = async (targetUserId) => {
        try {
            const token = sessionStorage.getItem('token');
            
            // 대상 사용자의 관리자 권한을 확인하는 방법
            // 방법 1: 별도 API가 있다면 사용
            // 방법 2: 관리자 멤버 목록에서 확인
            // 여기서는 관리자 멤버 목록 API를 사용해서 확인
            const response = await axios.get('http://localhost:80/admin/member/list', {
                headers: { Authorization: token }
            });
            
            if (response.data && response.data.success && response.data.members) {
                const targetUser = response.data.members.find(member => member.id === targetUserId);
                const isAdmin = targetUser && targetUser.admin_yn === 'Y';
                setTargetUserIsAdmin(isAdmin);
                console.log(`Target user ${targetUserId} admin status:`, isAdmin);
                return isAdmin;
            } else {
                console.log('Failed to check target user admin status, assuming not admin');
                setTargetUserIsAdmin(false);
                return false;
            }
        } catch (error) {
            console.error('Error checking target user admin status:', error);
            setTargetUserIsAdmin(false);
            return false;
        }
    };

    const fetchProfileData = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const currentUserId = sessionStorage.getItem('id');
            
            // 자신의 프로필 접근 시 리다이렉트
            if (id === currentUserId) {
                router.push('/profile/level');
                return;
            }

            // 먼저 대상 사용자의 관리자 권한 확인
            const isAdmin = await checkTargetUserAdminStatus(id);

            const response = await fetch(`http://localhost:80/profile/activity/${id}`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Target user activity data:', data);
                
                // API 응답 상태 확인
                if (data.status === 'success') {
                    // 기본 프로필 정보는 별도로 설정 (activity API에는 프로필 정보가 없음)
                    setProfileData({ m_name: `사용자 ${id}` }); // 임시로 설정
                    
                    // 백엔드에서 제공하는 전체 개수 필드 사용
                    const userStats = {
                        post_cnt: data.postCount || 0,
                        com_cnt: data.commentCount || 0,
                        like_cnt: data.likeCount || 0,
                        time_cnt: data.timelineCount || 0,
                        access_cnt: 0 // activity API에는 accessCnt가 없으므로 0으로 설정
                    };
                    
                    console.log('Target user stats from backend counts:', userStats);
                    setUserStats(userStats);
                    
                    // 현재 사용자 레벨 계산
                    if (levels.length > 0) {
                        calculateUserLevel(userStats, levels, isAdmin);
                    }
                } else {
                    console.error('API returned error status:', data.status, data.message);
                    setError(data.message || 'API 응답 오류');
                }
            } else if (response.status === 404) {
                setError('존재하지 않는 사용자입니다.');
            } else {
                console.error('Failed to fetch target user profile data, status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                setError('프로필 정보를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('프로필 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateUserLevel = (stats, levelList, isAdmin = false) => {
        // 레벨을 낮은 순서대로 정렬
        const sortedLevels = [...levelList].sort((a, b) => a.lv_no - b.lv_no);
        
        let currentLevel = sortedLevels[0]; // 기본값: 첫 번째 레벨
        
        // 관리자인 경우 무조건 레벨 0 (관리자 레벨)으로 설정
        if (isAdmin) {
            const adminLevel = sortedLevels.find(level => level.lv_no === 0);
            if (adminLevel) {
                setCurrentUserLevel(adminLevel);
                return;
            }
        }
        
        // 일반 사용자의 경우 레벨 0(관리자 레벨)은 제외하고 계산
        const availableLevels = sortedLevels.filter(level => level.lv_no !== 0);
        
        if (availableLevels.length > 0) {
            currentLevel = availableLevels[0];
            
            for (let level of availableLevels) {
                const meetsCriteria = 
                    stats.post_cnt >= level.post_cnt &&
                    stats.com_cnt >= level.com_cnt &&
                    stats.like_cnt >= level.like_cnt &&
                    stats.time_cnt >= level.time_cnt &&
                    stats.access_cnt >= level.access_cnt;
                    
                if (meetsCriteria) {
                    currentLevel = level;
                } else {
                    break;
                }
            }
        }
        
        setCurrentUserLevel(currentLevel);
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    useEffect(() => {
        if (levels.length > 0) {
            fetchProfileData();
        }
    }, [levels, id]);

    const isLevelUnlocked = (level) => {
        if (!userStats) return false;
        
        // 레벨 0(관리자 레벨)은 관리자만 달성 가능
        if (level.lv_no === 0) {
            return targetUserIsAdmin;
        }
        
        return userStats.post_cnt >= level.post_cnt &&
               userStats.com_cnt >= level.com_cnt &&
               userStats.like_cnt >= level.like_cnt &&
               userStats.time_cnt >= level.time_cnt &&
               userStats.access_cnt >= level.access_cnt;
    };

    const getProgressPercentage = (current, required) => {
        if (required === 0) return 100;
        return Math.min((current / required) * 100, 100);
    };

    if (error) {
        return (
            <div className="profile-level-container">
                <div className="error-message">
                    <h3>오류 발생</h3>
                    <p>{error}</p>
                    <button 
                        onClick={() => router.back()} 
                        className="back-btn"
                    >
                        뒤로가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-level-container">
            <div className="level-title">
                {profileData ? `${profileData.m_name}님의 레벨 현황` : '레벨 현황'}
                {targetUserIsAdmin && <span style={{marginLeft: '10px', fontSize: '0.8em', color: '#ff9800'}}>(관리자)</span>}
            </div>
            
            {isLoading ? (
                <div className="loading">로딩 중...</div>
            ) : (
                <>
                    {currentUserLevel && userStats && (
                        <div className="current-level-info">
                            <div className="current-level-card">
                                <img src={currentUserLevel.lv_icon} alt="current level" className="current-level-icon" />
                                <div className="current-level-details">
                                    <div className="current-level-text">
                                        <h3>현재 레벨: Level {currentUserLevel.lv_no}</h3>
                                        <h4>{currentUserLevel.lv_name}</h4>
                                    </div>
                                    <div className="user-stats">
                                        <div className="stat-item">
                                            <span>게시글 {userStats.post_cnt}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>댓글 {userStats.com_cnt}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>추천받은 수 {userStats.like_cnt}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>타임라인 {userStats.time_cnt}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>방문 횟수 {userStats.access_cnt}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="level-system-title">전체 레벨 시스템</div>
                    
                    <div className="level-list">
                        {levels.length === 0 ? (
                            <div className="no-data">등록된 레벨이 없습니다.</div>
                        ) : (
                            levels
                                .sort((a, b) => a.lv_no - b.lv_no)
                                .map((lv) => {
                                    const unlocked = isLevelUnlocked(lv);
                                    const isCurrent = currentUserLevel && currentUserLevel.lv_idx === lv.lv_idx;
                                    const isAdminLevel = lv.lv_no === 0;
                                    
                                    return (
                                        <div 
                                            className={`level-card ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''} ${isAdminLevel && !targetUserIsAdmin ? 'admin-only' : ''}`} 
                                            key={lv.lv_idx}
                                        >
                                            <img 
                                                src={lv.lv_icon} 
                                                alt="icon" 
                                                className="level-icon"
                                                style={{ 
                                                    opacity: unlocked ? 1 : 0.3,
                                                    filter: unlocked ? 'none' : 'grayscale(100%)'
                                                }}
                                            />
                                            <div className="level-header">
                                                Level {lv.lv_no} <span>{lv.lv_name}</span>
                                                {isCurrent && <div className="current-badge">현재 레벨</div>}
                                                {isAdminLevel && !targetUserIsAdmin && <div className="admin-badge">관리자 전용</div>}
                                            </div>
                                            <div className="level-requirements">
                                                <div className="requirement-item">
                                                    <span>게시글 {lv.post_cnt}</span>
                                                    {userStats && (!isAdminLevel || targetUserIsAdmin) && (
                                                        <div className="progress-bar">
                                                            <div 
                                                                className="progress-fill"
                                                                style={{ width: `${getProgressPercentage(userStats.post_cnt, lv.post_cnt)}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                    {isAdminLevel && !targetUserIsAdmin && (
                                                        <div className="progress-bar">
                                                            <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="requirement-item">
                                                    <span>댓글 {lv.com_cnt}</span>
                                                    {userStats && (!isAdminLevel || targetUserIsAdmin) && (
                                                        <div className="progress-bar">
                                                            <div 
                                                                className="progress-fill"
                                                                style={{ width: `${getProgressPercentage(userStats.com_cnt, lv.com_cnt)}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                    {isAdminLevel && !targetUserIsAdmin && (
                                                        <div className="progress-bar">
                                                            <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="requirement-item">
                                                    <span>추천받은 수 {lv.like_cnt}</span>
                                                    {userStats && (!isAdminLevel || targetUserIsAdmin) && (
                                                        <div className="progress-bar">
                                                            <div 
                                                                className="progress-fill"
                                                                style={{ width: `${getProgressPercentage(userStats.like_cnt, lv.like_cnt)}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                    {isAdminLevel && !targetUserIsAdmin && (
                                                        <div className="progress-bar">
                                                            <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="requirement-item">
                                                    <span>타임라인 {lv.time_cnt}</span>
                                                    {userStats && (!isAdminLevel || targetUserIsAdmin) && (
                                                        <div className="progress-bar">
                                                            <div 
                                                                className="progress-fill"
                                                                style={{ width: `${getProgressPercentage(userStats.time_cnt, lv.time_cnt)}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                    {isAdminLevel && !targetUserIsAdmin && (
                                                        <div className="progress-bar">
                                                            <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="requirement-item">
                                                    <span>방문 횟수 {lv.access_cnt}</span>
                                                    {userStats && (!isAdminLevel || targetUserIsAdmin) && (
                                                        <div className="progress-bar">
                                                            <div 
                                                                className="progress-fill"
                                                                style={{ width: `${getProgressPercentage(userStats.access_cnt, lv.access_cnt)}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                    {isAdminLevel && !targetUserIsAdmin && (
                                                        <div className="progress-bar">
                                                            <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {unlocked && (
                                                <div className="unlock-badge">달성 완료 ✓</div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </>
            )}
        </div>
    );
} 