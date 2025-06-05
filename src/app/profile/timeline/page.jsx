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
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        time_title: '',
        time_content: '',
        day: '',
        time_public_yn: true
    });

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

    // 수정 모드 시작
    const handleEditStart = (event) => {
        console.log('수정 시작:', event); // 디버깅용
        setEditingId(event.time_idx);
        setEditForm({
            time_title: event.time_title,
            time_content: event.time_content,
            day: event.day,
            time_public_yn: Number(event.time_public_yn) === 1
        });
    };

    // 수정 취소
    const handleEditCancel = () => {
        setEditingId(null);
    };

    // 수정 폼 입력 처리
    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // 수정 저장
    const handleEditSave = async (timeIdx) => {
        if (editForm.time_title.trim() === "" || editForm.time_content.trim() === "") {
            alert("타임라인 제목과 내용을 모두 입력해주세요.");
            return;
        }

        const token = sessionStorage.getItem('token');
        const userId = sessionStorage.getItem('id');
        
        if (!token || !userId) {
            router.push('/login');
            return;
        }

        const response = await axios.put('http://localhost/timeline/update',
            {
                time_idx: timeIdx,
                time_user_id: userId,
                ...editForm,
                time_public_yn: editForm.time_public_yn ? 1 : 0
            },
            {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.loginYN === 'success') {
            alert(response.data.msg);
            setEditingId(null);
            fetchEvents();
        } else {
            alert(response.data.msg);
        }
    };

    // 타임라인 삭제 핸들러
    const handleEventDelete = async (timeIdx) => {
        if (!window.confirm('정말 이 타임라인을 삭제하시겠습니까?')) {
            return;
        }

        const token = sessionStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const response = await axios.delete('http://localhost/timeline/delete', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            data: {
                time_idx: timeIdx,
                time_user_id: sessionStorage.getItem('id')
            }
        });

        if (response.data.loginYN === 'success') {
            alert(response.data.msg);
            fetchEvents();
        } else {
            alert(response.data.msg);
        }
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
                                    >
                                        {editingId === event.time_idx ? (
                                            <div className="edit-mode">
                                                <div className="edit-form">
                                                    <div className="edit-row">
                                                        <label>날짜</label>
                                                        <input
                                                            type="date"
                                                            name="day"
                                                            value={editForm.day}
                                                            onChange={handleEditFormChange}
                                                        />
                                                    </div>
                                                    <div className="edit-row">
                                                        <label>제목 (최대 50자)</label>
                                                        <input
                                                            type="text"
                                                            name="time_title"
                                                            value={editForm.time_title}
                                                            onChange={handleEditFormChange}
                                                            maxLength={50}
                                                        />
                                                        <small className="char-count">{editForm.time_title.length}/50</small>
                                                    </div>
                                                    <div className="edit-row">
                                                        <label>내용</label>
                                                        <textarea
                                                            name="time_content"
                                                            value={editForm.time_content}
                                                            onChange={handleEditFormChange}
                                                        />
                                                    </div>
                                                    <div className="edit-row">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                name="time_public_yn"
                                                                checked={editForm.time_public_yn}
                                                                onChange={handleEditFormChange}
                                                            />
                                                            공개
                                                        </label>
                                                    </div>
                                                    <div className="edit-actions">
                                                        <button
                                                            className="save-btn-small"
                                                            onClick={() => handleEditSave(event.time_idx)}
                                                        >
                                                            저장
                                                        </button>
                                                        <button
                                                            className="cancel-btn-small"
                                                            onClick={handleEditCancel}
                                                        >
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="event-card-header">
                                                    <div className="event-card-content">
                                                        <span className="event-date">{formatDate(event.day)}</span>
                                                        <div className="title-wrapper">
                                                            <h4 className="event-title" title={event.time_title}>
                                                                {event.time_title}
                                                            </h4>
                                                            {!event.time_public_yn && <span className="private-badge">비공개</span>}
                                                        </div>
                                                    </div>
                                                    {sessionStorage.getItem('id') === profile.id && (
                                                        <div className="event-actions">
                                                            <button 
                                                                className="event-edit-btn" 
                                                                onClick={() => handleEditStart(event)}
                                                                title="수정"
                                                            >
                                                                ✍🏻
                                                            </button>
                                                            <button 
                                                                className="event-delete-btn" 
                                                                onClick={() => handleEventDelete(event.time_idx)}
                                                                title="삭제"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="event-content" title={event.time_content}>
                                                    {event.time_content}
                                                </p>
                                            </>
                                        )}
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
