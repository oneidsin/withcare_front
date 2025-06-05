"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./timeline.css";

export default function ViewUserTimelinePage() {
    const router = useRouter();
    const params = useParams();
    const targetUserId = params.id;
    
    const [user, setUser] = useState(null);
    const [timelineItems, setTimelineItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
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

        fetchTimelineData();
    }, [targetUserId]);

    const fetchTimelineData = async () => {
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
                console.log("view API 실패:", error.response?.status);
                
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
                
                try {
                    profileRes = await axios.get(`http://localhost/profile/${targetUserId}`, {
                        headers: { Authorization: token }
                    });
                } catch (error2) {
                    console.log("기본 API도 실패:", error2.response?.status);
                    
                    if (error2.response?.status === 404) {
                        alert("존재하지 않는 사용자입니다.");
                    } else if (error2.response?.status === 403) {
                        alert("접근 권한이 없습니다.");
                    } else {
                        alert("접근할 수 없는 사용자입니다.");
                    }
                    router.push("/main");
                    return;
                }
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

            // 차단/탈퇴 사용자 체크
            if (userData?.block_yn === true || userData?.block_yn === 1) {
                alert("차단된 사용자의 프로필은 조회할 수 없습니다.");
                router.push("/main");
                return;
            }
            
            if (userData?.user_del_yn === true || userData?.user_del_yn === 1) {
                alert("탈퇴한 사용자의 프로필은 조회할 수 없습니다.");
                router.push("/main");
                return;
            }

            // 프로필 API에서 차단/탈퇴 필드가 없는 경우
            if (!('block_yn' in userData) || !('user_del_yn' in userData)) {
                console.warn("⚠️ 프로필 API에서 차단/탈퇴 상태를 제공하지 않음");
                console.log("📝 차단/탈퇴 상태 필드가 없어도 프로필 조회는 허용합니다.");
                // 프로필 API가 성공적으로 응답했다면 접근 가능한 사용자로 간주
            }

            // profile_yn 체크 - 비공개 프로필인 경우 타인 접근 차단
            const currentUserId = sessionStorage.getItem("id");
            if (userData?.profile_yn === false && currentUserId !== targetUserId) {
                alert("이 사용자는 프로필을 비공개로 설정했습니다.");
                router.back(); // 이전 페이지로 돌아가기
                return;
            }

            setUser({
                id: targetUserId,
                name: userData?.name || userData?.id || targetUserId,
                profile_yn: userData?.profile_yn || false
            });

            // 타임라인 정보 가져오기 - 공개 타임라인 API 사용
            const timelineEndpoint = `http://localhost:80/timeline/public/${targetUserId}`;
            
            let timelineRes = null;
            
            try {
                console.log("타임라인 API 호출:", timelineEndpoint);
                timelineRes = await axios.get(timelineEndpoint, {
                    headers: { Authorization: token }
                });
                console.log("타임라인 API 성공");
            } catch (error) {
                console.log("타임라인 API 실패:", error.response?.status || error.message);
            }

            if (timelineRes && timelineRes.data && timelineRes.data.loginYN === 'success') {
                const timelineData = timelineRes.data.data || [];
                
                // 날짜순 정렬 (최신순)
                timelineData.sort((a, b) => {
                    const dateA = new Date(a.day || 0);
                    const dateB = new Date(b.day || 0);
                    return dateB - dateA;
                });
                
                setTimelineItems(timelineData);
                console.log("타임라인 데이터 로드 완료:", timelineData.length, "개");
            } else {
                console.log("타임라인 데이터가 없거나 로그인 실패");
                setTimelineItems([]);
            }

        } catch (error) {
            console.error("타임라인 데이터 로딩 실패:", error);
            setError("타임라인 정보를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 타임라인 타입별 아이콘 반환
    const getTimelineIcon = (type) => {
        switch (type) {
            case "join":
                return "👋";
            case "post":
                return "📝";
            case "comment":
                return "💬";
            case "like":
                return "❤️";
            case "level_up":
                return "⭐";
            case "badge":
                return "🏆";
            case "treatment":
                return "🏥";
            case "recovery":
                return "🌟";
            default:
                return "📅";
        }
    };

    // 타임라인 타입별 색상 반환
    const getTimelineColor = (type) => {
        switch (type) {
            case "join":
                return "#4CAF50";
            case "post":
                return "#2196F3";
            case "comment":
                return "#FF9800";
            case "like":
                return "#E91E63";
            case "level_up":
                return "#9C27B0";
            case "badge":
                return "#FFD700";
            case "treatment":
                return "#795548";
            case "recovery":
                return "#00BCD4";
            default:
                return "#607D8B";
        }
    };

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="view-user-timeline">
            <div className="timeline-header">
                <button className="back-button" onClick={() => router.push(`/profile/view/${targetUserId}`)}>
                    ← 프로필로 돌아가기
                </button>
                <h2>{user?.name}님의 타임라인</h2>
            </div>

            <div className="timeline-container">
                {timelineItems.length > 0 ? (
                    <div className="timeline">
                        {timelineItems.map((item, index) => (
                            <div key={item.time_idx || index} className="timeline-item">
                                <div 
                                    className="timeline-marker"
                                    style={{ backgroundColor: getTimelineColor('default') }}
                                >
                                    <span className="timeline-icon">
                                        {getTimelineIcon('default')}
                                    </span>
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-date">
                                        {new Date(item.day).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="timeline-card">
                                        <h3 className="timeline-title">{item.time_title}</h3>
                                        <p className="timeline-description">{item.time_content}</p>
                                        {item.time_photo && (
                                            <div className="timeline-photo">
                                                <img 
                                                    src={`http://localhost:80/${item.time_photo}`} 
                                                    alt="타임라인 사진"
                                                    onError={(e) => { 
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-timeline">
                        <div className="empty-icon">📅</div>
                        <h3>타임라인이 비어있습니다</h3>
                        <p>아직 기록된 타임라인이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 