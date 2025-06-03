"use client"

import { useEffect, useState } from 'react';
import axios from 'axios';
import './level.css';

export default function ProfileLevelPage() {
    const [levels, setLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [currentUserLevel, setCurrentUserLevel] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchLevels = async () => {
        try {
            setIsLoading(true);
            const token = sessionStorage.getItem('token');
            
            // 레벨 목록 조회 (admin API 사용)
            const res = await axios.get('http://localhost:80/admin/level', {
                headers: { Authorization: token }
            });

            console.log('Level response:', res.data);

            if (res.data && Array.isArray(res.data)) {
                setLevels(res.data);
            } else if (res.data && res.data.result && Array.isArray(res.data.result)) {
                setLevels(res.data.result);
            } else {
                console.error('Invalid level data format:', res.data);
                setLevels([]);
            }
        } catch (error) {
            console.error('Error fetching levels:', error);
            setLevels([]);
        } finally {
            setIsLoading(false);
        }
    };

    const checkAdminStatus = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setIsAdmin(false);
                return false;
            }

            // 백엔드 API로 관리자 권한 확인
            const response = await fetch('http://localhost:80/admin/check', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const adminStatus = data.success && data.isAdmin;
                setIsAdmin(adminStatus);
                console.log('Admin check result:', data, 'Is admin:', adminStatus);
                return adminStatus;
            } else {
                console.error('Admin check failed:', response.status);
                setIsAdmin(false);
                return false;
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            return false;
        }
    };

    const fetchUserStats = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const userId = sessionStorage.getItem('id');
            
            console.log('Fetching user stats for userId:', userId);
            
            // profile/activity/{id} API를 사용해서 활동 데이터와 카운트 정보 가져오기
            const response = await fetch(`http://localhost:80/profile/activity/${userId}`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('User activity data:', data);
                
                // API 응답 상태 확인
                if (data.status === 'success') {
                    // 백엔드에서 제공하는 전체 개수 필드 사용
                    const stats = {
                        post_cnt: data.postCount || 0,
                        com_cnt: data.commentCount || 0,
                        like_cnt: data.likeCount || 0,
                        time_cnt: data.timelineCount || 0,
                        access_cnt: 0 // activity API에는 accessCnt가 없으므로 0으로 설정
                    };
                    
                    console.log('User stats from backend counts:', stats);
                    setUserStats(stats);
                    
                    // 현재 사용자 레벨 계산
                    if (levels.length > 0) {
                        calculateUserLevel(stats, levels);
                    }
                } else {
                    console.error('API returned error status:', data.status, data.message);
                    throw new Error(data.message || 'API 응답 오류');
                }
            } else {
                console.error('Failed to fetch user activity data, status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('API 호출 실패');
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
            // 에러 시 기본값 설정
            const defaultStats = {
                post_cnt: 0,
                com_cnt: 0,
                like_cnt: 0,
                time_cnt: 0,
                access_cnt: 0
            };
            setUserStats(defaultStats);
            
            if (levels.length > 0) {
                calculateUserLevel(defaultStats, levels);
            }
        }
    };

    const calculateUserLevel = (stats, levelList) => {
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
        const initializeData = async () => {
            await checkAdminStatus();
            await fetchLevels();
        };
        initializeData();
    }, []);

    useEffect(() => {
        if (levels.length > 0) {
            fetchUserStats();
        }
    }, [levels, isAdmin]);

    const isLevelUnlocked = (level) => {
        if (!userStats) return false;
        
        // 레벨 0(관리자 레벨)은 관리자만 달성 가능
        if (level.lv_no === 0) {
            return isAdmin;
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

    return (
        <div className="profile-level-container">
            <div className="level-title">내 레벨 현황</div>
            
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
                {isLoading ? (
                    <div className="loading">로딩 중...</div>
                ) : levels.length === 0 ? (
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
                                    className={`level-card ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''} ${isAdminLevel && !isAdmin ? 'admin-only' : ''}`} 
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
                                        {isAdminLevel && !isAdmin && <div className="admin-badge">관리자 전용</div>}
                                    </div>
                                    <div className="level-requirements">
                                        <div className="requirement-item">
                                            <span>게시글 {lv.post_cnt}</span>
                                            {userStats && !isAdminLevel && (
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${getProgressPercentage(userStats.post_cnt, lv.post_cnt)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                            {isAdminLevel && !isAdmin && (
                                                <div className="progress-bar">
                                                    <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="requirement-item">
                                            <span>댓글 {lv.com_cnt}</span>
                                            {userStats && !isAdminLevel && (
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${getProgressPercentage(userStats.com_cnt, lv.com_cnt)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                            {isAdminLevel && !isAdmin && (
                                                <div className="progress-bar">
                                                    <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="requirement-item">
                                            <span>추천받은 수 {lv.like_cnt}</span>
                                            {userStats && !isAdminLevel && (
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${getProgressPercentage(userStats.like_cnt, lv.like_cnt)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                            {isAdminLevel && !isAdmin && (
                                                <div className="progress-bar">
                                                    <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="requirement-item">
                                            <span>타임라인 {lv.time_cnt}</span>
                                            {userStats && !isAdminLevel && (
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${getProgressPercentage(userStats.time_cnt, lv.time_cnt)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                            {isAdminLevel && !isAdmin && (
                                                <div className="progress-bar">
                                                    <div className="progress-fill admin-locked" style={{ width: '0%' }}></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="requirement-item">
                                            <span>방문 횟수 {lv.access_cnt}</span>
                                            {userStats && !isAdminLevel && (
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${getProgressPercentage(userStats.access_cnt, lv.access_cnt)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                            {isAdminLevel && !isAdmin && (
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
        </div>
    );
}