"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../profile.css";
import axios from 'axios';

export default function TimelinePage() {
    const router = useRouter();

    // 선택된 연도 상태
    const [selectedYr, setSelectedYr] = useState(new Date().getFullYear().toString());

    // 이벤트 목록 및 로딩 상태
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);


    // 프로필 상태
    const [profile, setProfile] = useState({
        id: '',
        introduction: '',
        profile_image: '/defaultProfileImg.png'
    });

    // 현재 연도부터 과거 10년까지 리스트 생성
    const currentYr = new Date().getFullYear();
    const allYrs = Array.from({ length: 11 }, (_, i) => currentYr - i);

    // 연도 페이지네이션 처리
    const YR_PER_PAGE = 4;
    const [yrPage, setYrPage] = useState(0);
    const displayedYrs = allYrs.slice(yrPage * YR_PER_PAGE, (yrPage + 1) * YR_PER_PAGE);
    const hasNextPage = (yrPage + 1) * YR_PER_PAGE < allYrs.length;
    const hasPrevPage = yrPage > 0;

    // 페이지 로딩 시 프로필과 이벤트 데이터 불러오기
    useEffect(() => {
        fetchProfile();
        fetchEvents();
    }, []);

    // 프로필 정보 불러오기
    const fetchProfile = async () => {
        const token = sessionStorage.getItem('token');
        const id = sessionStorage.getItem('id');

        if (!token || !id) {
            router.push('/login');
            return;
        }

        const res = await axios.get(`http://localhost:80/profile/${id}`, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        const profileData = res.data.data;

        setProfile({
            id: profileData.id || id,
            introduction: profileData.intro || '소개글이 없습니다.',
            profile_image: profileData.profile_photo && profileData.profile_photo !== '' ?
                `http://localhost:80/file/${profileData.profile_photo}` :
                '/defaultProfileImg.png'
        });
    };

    // 타임라인 이벤트 데이터 불러오기
    const fetchEvents = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const res = await axios.get('http://localhost:80/timeline/list', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        const allEvents = Object.values(res.data.data)
            .flat()
            .sort((a, b) => new Date(b.day) - new Date(a.day));

        setEvents(allEvents);
        setLoading(false);
    };

    // 연도 페이지네이션 제어 함수
    const handleNextYrPage = () => {
        if (hasNextPage) setYrPage(prev => prev + 1);
    };

    const handlePrevYrPage = () => {
        if (hasPrevPage) setYrPage(prev => prev - 1);
    };

    // 선택된 연도의 이벤트 필터링
    const filteredEvents = events.filter(
        (e) => new Date(e.day).getFullYear().toString() === selectedYr
    );

    // 날짜 클릭 시 글쓰기 페이지 이동
    const handleEventClick = (date) => {
        router.push(`/profile/timeline/write?date=${date}`);
    };

    const handleCalendarClick = (date) => {
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        const formattedDate = localDate.toISOString().split('T')[0];
        router.push(`/profile//timeline/write?date=${formattedDate}`);
    };

    // 날짜 포맷 한국어 형식으로 변환
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    return (
        <div className="timeline-page">
            <div className="timeline-container">
                {/* 프로필 영역 및 연도 선택 */}
                <div className="timeline-header">
                    <div className="profile-section">
                        <div className="profile-image-wrapper">
                            <img
                                src={profile.profile_image}
                                alt="프로필 이미지"
                                className="profile-image"
                                onError={(e) => {
                                    e.target.onerror = null; // 무한 루프 방지
                                    e.target.src = '/defaultProfileImg.png';
                                }}
                            />
                        </div>
                        <div className="profile-text">
                            <h2 className="profile-name">{profile.id}</h2>
                            <p className="profile-bio">{profile.introduction}</p>
                        </div>
                    </div>
                    <div className="year-selector">
                        <button
                            className="year-nav-button"
                            onClick={handlePrevYrPage}
                            disabled={!hasPrevPage}
                        >
                            &#8249;
                        </button>
                        {displayedYrs.map((year) => (
                            <button
                                key={year}
                                onClick={() => setSelectedYr(year.toString())}
                                className={selectedYr === year.toString() ? "active-year" : ""}
                            >
                                {year}
                            </button>
                        ))}
                        <button
                            className="year-nav-button"
                            onClick={handleNextYrPage}
                            disabled={!hasNextPage}
                        >
                            &#8250;
                        </button>
                    </div>
                </div>

                {/* 본문: 캘린더와 이벤트 카드 */}
                <div className="timeline-content">
                    <div className="calendar-section">
                        <div className="calendar-panel">
                            <Calendar
                                calendarType="gregory"
                                locale="ko-KR"
                                formatDay={(locale, date) => date.getDate()}
                                tileClassName={({ date }) => {
                                    const formatted = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                                        .toISOString().split('T')[0];
                                    return events.some((e) => e.day === formatted) ? "has-event" : null;
                                }}
                                onClickDay={handleCalendarClick}
                            />
                        </div>
                    </div>

                    <div className="events-section">
                        <h3 className="events-title">📝 {selectedYr}년의 기록</h3>
                        <div className="event-panel">
                            {loading ? (
                                <div className="empty-message">
                                    <p>데이터를 불러오는 중입니다...</p>
                                </div>
                            ) : filteredEvents.length > 0 ? (
                                filteredEvents.map((event, idx) => (
                                    <div
                                        key={idx}
                                        className="event-card"
                                        // onClick={() => handleEventClick(event.day)}
                                    >
                                        <div className="event-card-header">
                                            <span className="event-date">{formatDate(event.day)}</span>
                                            <h4 className="event-title">{event.time_title}</h4>
                                        </div>
                                        <p className="event-content">{event.time_content}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-message">
                                    <p>해당 연도에 기록된 타임라인이 없습니다.</p>
                                    <button
                                        className="add-event-button"
                                        onClick={() => handleCalendarClick(new Date())}
                                    >
                                        새로운 타임라인 작성하기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
