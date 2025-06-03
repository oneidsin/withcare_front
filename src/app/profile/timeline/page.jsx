"use client";

import React, { useState } from "react";
import Calendar from "react-calendar";
import { useRouter } from "next/navigation";
import { AiOutlineUser } from "react-icons/ai";
import "react-calendar/dist/Calendar.css";
import "../profile.css";

export default function TimelinePage() {
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarDate, setCalendarDate] = useState(new Date()); // 기준 달력 날짜

    const events = [
        { date: "2019-05-05", title: "어린이날" },
        { date: "2020-11-11", title: "빼빼로" },
        { date: "2012-01-30", title: "그냥" },
        { date: "2025-02-10", title: "아무날" },
        { date: "2021-05-27", title: "아닌 날" },
        { date: "2022-11-26", title: "샘플" },
        { date: "2012-07-04", title: "세팅" },
        { date: "2022-08-05", title: "오늘" },
        { date: "2002-01-12", title: "저녁" },
        { date: "2023-03-21", title: "주말" },
        { date: "2025-04-09", title: "기다려" },
        { date: "2017-09-14", title: "내일" },
        { date: "2025-05-09", title: "점심" },
        { date: "2025-06-11", title: "아침" }
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const hasEvent = (date) => {
        const d = formatDate(date);
        return events.some(e => e.date === d);
    };

    const handleDateClick = (value) => {
        const dateStr = value.toISOString().slice(0, 10);
        router.push(`/timeline/write?date=${dateStr}`);
    };

    const handleEventClick = (date) => {
        router.push(`/timeline/write?date=${date}`);
    };

    const moveMonth = (delta) => {
        const newDate = new Date(calendarDate);
        newDate.setMonth(calendarDate.getMonth() + delta);
        setCalendarDate(newDate);
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = (`0${date.getMonth() + 1}`).slice(-2);
        const day = (`0${date.getDate()}`).slice(-2);
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="timeline-wrapper">
            {/* 왼쪽 */}
            <div className="left-panel">
                <div className="profile-mini">
                    <AiOutlineUser className="mini-img" style={{ fontSize: '40px', color: '#666' }} />
                    <div className="mini-name"></div>
                </div>
                <div className="event-list">
                    {events.map((e, idx) => (
                        <div key={idx} className="event-item" onClick={() => handleEventClick(e.date)}>
                            <strong>{e.date}:</strong> {e.title}
                        </div>
                    ))}
                </div>
            </div>

            {/* 가운데 캘린더 */}
            <div className="calendar-container">

                <Calendar
                    onClickDay={handleDateClick}
                    value={selectedDate}
                    tileClassName={({ date, view }) =>
                        view === "month" && hasEvent(date) ? "has-event" : null
                    }
                    calendarType="gregory"
                    activeStartDate={calendarDate}
                    onActiveStartDateChange={({ activeStartDate }) => {
                        if (activeStartDate) setCalendarDate(activeStartDate);
                    }}
                />
            </div>
        </div>
    );
}
