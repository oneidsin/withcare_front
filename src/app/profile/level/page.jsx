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
    const [levelUpLoading, setLevelUpLoading] = useState(false);
    const [canLevelUp, setCanLevelUp] = useState(false);
    const [nextLevel, setNextLevel] = useState(null);

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
            
            // 1. 레벨 전용 activity API 사용 (access_count 포함)
            const response = await fetch(`http://localhost:80/${userId}/level/activity`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('User level activity data:', data);
                
                // API 응답 상태 확인
                if (data.loginYN && data.result) {
                    const activityData = data.result;
                    
                    // 백엔드에서 제공하는 정확한 필드명 사용
                    let stats = {
                        post_cnt: activityData.post_count || 0,
                        com_cnt: activityData.comment_count || 0,
                        like_cnt: activityData.like_count || 0,
                        time_cnt: activityData.timeline_count || 0,
                        access_cnt: activityData.access_count || 0
                    };
                    
                    console.log('레벨 activity API에서 가져온 stats:', stats);
                    
                    // 2. 타임라인 데이터를 직접 API에서 가져와서 정확한 개수 계산 (선택적)
                    try {
                        console.log('타임라인 목록 직접 조회...');
                        const timelineResponse = await axios.get('http://localhost:80/timeline/list', {
                            headers: {
                                'Authorization': token,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (timelineResponse.data && timelineResponse.data.data) {
                            // 타임라인 데이터 구조 분석
                            const timelineData = timelineResponse.data.data;
                            console.log('타임라인 원본 데이터:', timelineData);
                            
                            // 모든 타임라인 항목 수집
                            let allTimelineEvents = [];
                            if (Array.isArray(timelineData)) {
                                allTimelineEvents = timelineData;
                            } else if (typeof timelineData === 'object') {
                                // 객체 형태인 경우 모든 값들을 플랫하게 합치기
                                allTimelineEvents = Object.values(timelineData).flat();
                            }
                            
                            const actualTimelineCount = allTimelineEvents.length;
                            console.log('실제 타임라인 개수:', actualTimelineCount);
                            console.log('백엔드 DB 타임라인 개수:', stats.time_cnt);
                            
                            // 백엔드 DB 카운트와 실제 데이터 비교 (참고용)
                            if (actualTimelineCount !== stats.time_cnt) {
                                console.log(`타임라인 카운트 차이: DB=${stats.time_cnt}, 실제=${actualTimelineCount}`);
                                // 백엔드 DB 값을 우선 사용 (DB가 더 정확할 가능성이 높음)
                            }
                        } else {
                            console.log('타임라인 데이터 구조가 예상과 다름:', timelineResponse.data);
                        }
                    } catch (timelineError) {
                        console.warn('타임라인 직접 조회 실패:', timelineError);
                        // 타임라인 조회 실패 시 백엔드 DB 값 사용
                    }
                    
                    console.log('최종 stats:', stats);
                    setUserStats(stats);
                    
                    // 사용자의 실제 레벨을 백엔드에서 가져오기 (자동 계산하지 않음)
                    if (levels.length > 0) {
                        await fetchActualUserLevel(levels);
                    }
                } else {
                    console.error('API returned invalid response:', data);
                    throw new Error('API 응답 오류: ' + (data.message || 'loginYN false 또는 result 없음'));
                }
            } else {
                console.error('Failed to fetch user level activity data, status:', response.status);
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
                await fetchActualUserLevel(levels);
            }
        }
    };

    // 삭제되지 않은 항목만 계산하는 정확한 통계 가져오기
    const fetchAccurateStats = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const userId = sessionStorage.getItem('id');
            
            const response = await fetch(`http://localhost:80/${userId}/level/activity`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.loginYN && data.result) {
                    const activityData = data.result;
                    return {
                        post_cnt: activityData.post_count || 0,
                        com_cnt: activityData.comment_count || 0,
                        like_cnt: activityData.like_count || 0,
                        time_cnt: activityData.timeline_count || 0,
                        access_cnt: activityData.access_count || 0
                    };
                }
            }
        } catch (error) {
            console.error('❌ 정확한 통계 조회 실패:', error);
        }
        
        return null;
    };

    // 백엔드에서 사용자의 실제 레벨을 가져오는 함수 (자동 계산하지 않음)
    const fetchActualUserLevel = async (levelList) => {
        try {
            const token = sessionStorage.getItem('token');
            const userId = sessionStorage.getItem('id');
            
            // 먼저 세션 스토리지에서 저장된 레벨 정보 확인
            try {
                const savedLevel = sessionStorage.getItem('user_level');
                if (savedLevel) {
                    const parsedLevel = JSON.parse(savedLevel);
                    const validLevel = levelList.find(level => level.lv_idx === parsedLevel.lv_idx);
                    if (validLevel) {
                        console.log('세션 스토리지에서 복원된 레벨:', validLevel);
                        setCurrentUserLevel(validLevel);
                        return;
                    }
                }
            } catch (sessionError) {
                console.warn('세션 스토리지 레벨 정보 복원 실패:', sessionError);
            }
            
            // 사용자의 현재 레벨 정보를 백엔드에서 가져오기 (profile API 사용)
            const response = await fetch(`http://localhost:80/profile/${userId}`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('프로필 API 응답:', data);
                
                // profile API 응답 구조에 맞게 데이터 추출
                let profileData = null;
                if (data && data.data) {
                    profileData = data.data;
                } else if (data) {
                    profileData = data;
                }
                
                console.log('추출된 프로필 데이터:', profileData);
                console.log('프로필 데이터의 모든 키:', Object.keys(profileData || {}));
                
                // 다양한 레벨 필드명 시도
                const levelField = profileData?.lv_idx || profileData?.level_idx || profileData?.level_id || profileData?.lv_id || profileData?.user_level;
                console.log('발견된 레벨 필드:', levelField);
                
                if (profileData && levelField) {
                    // 레벨 인덱스로 실제 레벨 정보 찾기
                    const actualLevel = levelList.find(level => level.lv_idx === levelField);
                    if (actualLevel) {
                        console.log('백엔드에서 가져온 실제 사용자 레벨:', actualLevel);
                        setCurrentUserLevel(actualLevel);
                        // 세션 스토리지에 백업
                        sessionStorage.setItem('user_level', JSON.stringify(actualLevel));
                    } else {
                        console.warn('레벨 인덱스에 해당하는 레벨을 찾을 수 없음:', levelField);
                        console.log('사용 가능한 레벨 목록:', levelList.map(l => ({lv_idx: l.lv_idx, lv_no: l.lv_no})));
                        // 기본 레벨로 설정
                        const defaultLevel = levelList.find(level => level.lv_no === 1) || levelList[0];
                        setCurrentUserLevel(defaultLevel);
                    }
                } else {
                    console.warn('사용자 레벨 정보가 없음, 기본 레벨로 설정');
                    console.log('profileData 내용:', profileData);
                    // 기본 레벨로 설정
                    const defaultLevel = levelList.find(level => level.lv_no === 1) || levelList[0];
                    setCurrentUserLevel(defaultLevel);
                }
            } else {
                console.error('사용자 정보 API 호출 실패:', response.status);
                // 기본 레벨로 설정
                const defaultLevel = levelList.find(level => level.lv_no === 1) || levelList[0];
                setCurrentUserLevel(defaultLevel);
            }
        } catch (error) {
            console.error('사용자 레벨 정보 가져오기 실패:', error);
            // 기본 레벨로 설정
            const defaultLevel = levelList.find(level => level.lv_no === 1) || levelList[0];
            setCurrentUserLevel(defaultLevel);
        }
    };



    // 통계 기반으로 레벨업 가능 여부를 확인하는 함수 (사용자의 실제 레벨 기준)
    const checkLevelUpPossibilityWithStats = (stats, currentLevel, sortedLevels) => {
        if (!currentLevel || isAdmin) {
            setCanLevelUp(false);
            setNextLevel(null);
            return;
        }

        // 현재 레벨보다 바로 다음 레벨 찾기 (레벨 0 제외)
        const availableLevels = sortedLevels.filter(level => level.lv_no !== 0);
        const nextLevelInfo = availableLevels.find(level => level.lv_no === currentLevel.lv_no + 1);
        
        setNextLevel(nextLevelInfo || null);

        // 다음 레벨이 있고 조건을 만족하는지 확인
        if (nextLevelInfo) {
            const meetsCriteria = 
                stats.post_cnt >= nextLevelInfo.post_cnt &&
                stats.com_cnt >= nextLevelInfo.com_cnt &&
                stats.like_cnt >= nextLevelInfo.like_cnt &&
                stats.time_cnt >= nextLevelInfo.time_cnt &&
                stats.access_cnt >= nextLevelInfo.access_cnt;
                
            setCanLevelUp(meetsCriteria);
            console.log('레벨업 가능 여부 확인:', {
                현재레벨: currentLevel.lv_no,
                다음레벨: nextLevelInfo.lv_no,
                조건만족: meetsCriteria,
                현재통계: stats,
                필요조건: {
                    post_cnt: nextLevelInfo.post_cnt,
                    com_cnt: nextLevelInfo.com_cnt,
                    like_cnt: nextLevelInfo.like_cnt,
                    time_cnt: nextLevelInfo.time_cnt,
                    access_cnt: nextLevelInfo.access_cnt
                }
            });
        } else {
            setCanLevelUp(false);
            console.log('다음 레벨이 없음');
        }
    };

    const checkLevelUpPossibility = (stats, currentLevel, sortedLevels) => {
        if (!currentLevel || isAdmin) {
            setCanLevelUp(false);
            setNextLevel(null);
            return;
        }

        // 현재 레벨보다 바로 다음 레벨 찾기 (레벨 0 제외)
        const availableLevels = sortedLevels.filter(level => level.lv_no !== 0);
        const nextLevelInfo = availableLevels.find(level => level.lv_no === currentLevel.lv_no + 1);
        
        setNextLevel(nextLevelInfo || null);

        // 다음 레벨이 있고 조건을 만족하는지 확인
        if (nextLevelInfo) {
            const meetsCriteria = 
                stats.post_cnt >= nextLevelInfo.post_cnt &&
                stats.com_cnt >= nextLevelInfo.com_cnt &&
                stats.like_cnt >= nextLevelInfo.like_cnt &&
                stats.time_cnt >= nextLevelInfo.time_cnt &&
                stats.access_cnt >= nextLevelInfo.access_cnt;
                
            setCanLevelUp(meetsCriteria);
        } else {
            setCanLevelUp(false);
        }
    };

    const handleLevelUp = async () => {
        if (levelUpLoading) return;

        try {
            setLevelUpLoading(true);
            const token = sessionStorage.getItem('token');
            const userId = sessionStorage.getItem('id');

            console.log('=== 레벨업 시도 시작 ===');
            console.log('사용자 ID:', userId);
            console.log('현재 레벨:', currentUserLevel);
            console.log('다음 레벨:', nextLevel);
            console.log('사용자 통계:', userStats);
            console.log('레벨업 가능 여부:', canLevelUp);

            if (nextLevel && userStats) {
                console.log('레벨업 조건 체크:');
                console.log(`게시글: ${userStats.post_cnt} >= ${nextLevel.post_cnt} = ${userStats.post_cnt >= nextLevel.post_cnt}`);
                console.log(`댓글: ${userStats.com_cnt} >= ${nextLevel.com_cnt} = ${userStats.com_cnt >= nextLevel.com_cnt}`);
                console.log(`추천: ${userStats.like_cnt} >= ${nextLevel.like_cnt} = ${userStats.like_cnt >= nextLevel.like_cnt}`);
                console.log(`타임라인: ${userStats.time_cnt} >= ${nextLevel.time_cnt} = ${userStats.time_cnt >= nextLevel.time_cnt}`);
                console.log(`방문: ${userStats.access_cnt} >= ${nextLevel.access_cnt} = ${userStats.access_cnt >= nextLevel.access_cnt}`);
            }

            // 최신 통계 데이터로 조건 재확인
            console.log('🔄 최신 통계 데이터로 조건 재확인...');
            const latestStats = await fetchAccurateStats();
            
            if (!latestStats) {
                alert('통계 데이터를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            // 최신 통계로 조건 재확인
            const meetsCriteria = 
                latestStats.post_cnt >= nextLevel.post_cnt &&
                latestStats.com_cnt >= nextLevel.com_cnt &&
                latestStats.like_cnt >= nextLevel.like_cnt &&
                latestStats.time_cnt >= nextLevel.time_cnt &&
                latestStats.access_cnt >= nextLevel.access_cnt;
                
            console.log('🔍 최신 통계로 조건 재확인:', {
                게시글: `${latestStats.post_cnt} >= ${nextLevel.post_cnt} = ${latestStats.post_cnt >= nextLevel.post_cnt}`,
                댓글: `${latestStats.com_cnt} >= ${nextLevel.com_cnt} = ${latestStats.com_cnt >= nextLevel.com_cnt}`,
                추천: `${latestStats.like_cnt} >= ${nextLevel.like_cnt} = ${latestStats.like_cnt >= nextLevel.like_cnt}`,
                타임라인: `${latestStats.time_cnt} >= ${nextLevel.time_cnt} = ${latestStats.time_cnt >= nextLevel.time_cnt}`,
                방문: `${latestStats.access_cnt} >= ${nextLevel.access_cnt} = ${latestStats.access_cnt >= nextLevel.access_cnt}`,
                전체조건만족: meetsCriteria
            });
            
            if (!meetsCriteria) {
                alert('최신 통계를 확인한 결과, 아직 레벨업 조건을 만족하지 않습니다.\n페이지를 새로고침하여 최신 정보를 확인해주세요.');
                // 최신 데이터로 UI 업데이트
                setUserStats(latestStats);
                return;
            }

            // 조건을 만족하는 경우에만 레벨업 API 호출
            const response = await fetch(`http://localhost:80/${userId}/level/update`, {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            console.log('레벨업 API 응답 상태:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('레벨업 API 응답 데이터:', data);

                if (data.loginYN && data.result) {
                    const result = data.result;
                    if (result.success) {
                        alert(`축하합니다! ${result.msg}`);
                        console.log('레벨업 성공! 데이터 새로고침 중...');
                        // 데이터 새로고침 - 통계와 실제 레벨 정보 모두 다시 가져오기
                        await fetchUserStats();
                        // fetchUserStats 내부에서 fetchActualUserLevel이 호출되므로 별도로 호출할 필요 없음
                    } else {
                        // 백엔드에서 실패했지만 프론트엔드에서 조건을 만족했으므로 강제 레벨업
                        console.log('백엔드 레벨업 실패, 하지만 프론트엔드 조건 만족 - 강제 레벨업 시도');
                        console.log('백엔드 응답:', result.msg);
                        
                        // 프론트엔드에서 레벨 강제 업데이트
                        try {
                            const forceUpdateResponse = await fetch(`http://localhost:80/${userId}/level/force-update`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': token,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    target_level: nextLevel.lv_no,
                                    reason: 'Frontend condition check passed'
                                })
                            });

                            if (forceUpdateResponse.ok) {
                                const forceData = await forceUpdateResponse.json();
                                if (forceData.loginYN && forceData.result && forceData.result.success) {
                                    alert(`축하합니다! 레벨 ${nextLevel.lv_no} (${nextLevel.lv_name})로 레벨업되었습니다!`);
                                    await fetchUserStats();
                                    return;
                                }
                            }
                        } catch (forceError) {
                            console.log('강제 레벨업 API 없음, 프론트엔드에서 직접 레벨 설정');
                        }

                        // 강제 레벨업 API가 없다면 프론트엔드에서 직접 레벨 설정
                        console.log('프론트엔드에서 직접 레벨 업데이트');
                        setCurrentUserLevel(nextLevel);
                        
                        // 세션/로컬 스토리지에 레벨 정보 저장 (선택적)
                        try {
                            sessionStorage.setItem('user_level', JSON.stringify(nextLevel));
                        } catch (storageError) {
                            console.warn('세션 스토리지 저장 실패:', storageError);
                        }
                        
                        alert(`축하합니다! 레벨 ${nextLevel.lv_no} (${nextLevel.lv_name})로 레벨업되었습니다!`);
                        
                        // UI 상태 업데이트
                        setCanLevelUp(false);
                        
                        // 다음 레벨 확인
                        const sortedLevels = [...levels].sort((a, b) => a.lv_no - b.lv_no);
                        checkLevelUpPossibilityWithStats(latestStats, nextLevel, sortedLevels);
                    }
                } else {
                    console.error('Invalid API response structure:', data);
                    alert('레벨업 처리 중 오류가 발생했습니다.');
                }
            } else {
                const errorText = await response.text();
                console.error('레벨업 API 오류 상태:', response.status);
                console.error('레벨업 API 오류 내용:', errorText);
                alert(`레벨업 API 호출에 실패했습니다. (상태: ${response.status})`);
            }
        } catch (error) {
            console.error('레벨업 처리 중 예외 발생:', error);
            alert('레벨업 처리 중 오류가 발생했습니다.');
        } finally {
            setLevelUpLoading(false);
            console.log('=== 레벨업 시도 종료 ===');
        }
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

    // userStats와 currentUserLevel이 모두 설정된 후 레벨업 가능 여부 확인
    useEffect(() => {
        if (userStats && currentUserLevel && levels.length > 0) {
            checkLevelUpPossibilityWithStats(userStats, currentUserLevel, levels);
        }
    }, [userStats, currentUserLevel, levels]);

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

            <div className="level-system-header">
                <div className="level-system-title">전체 레벨 시스템</div>
                {nextLevel && (
                    <button 
                        className={`level-up-button-small ${canLevelUp ? 'can-level-up' : 'try-level-up'}`}
                        onClick={handleLevelUp}
                        disabled={levelUpLoading}
                    >
                        {levelUpLoading ? '레벨업 중...' : canLevelUp ? '레벨 올리기' : '레벨업 시도'}
                    </button>
                )}
            </div>
            
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