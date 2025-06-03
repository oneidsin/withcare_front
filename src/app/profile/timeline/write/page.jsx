"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import "../../profile.css";
import axios from 'axios';

export default function TimelineWritePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 쿼리 파라미터에서 날짜 가져오거나 오늘 날짜로 설정
    const defaultDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 입력 폼 상태 관리
    const [formData, setFormData] = useState({
        date: defaultDate,
        title: '',
        content: '',
        isPublic: true
    });

    // 작성 완료 시 서버에 POST 요청
    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = sessionStorage.getItem('token');
        if (!token) {
            router.push('/login');  // 로그인 안 된 경우 로그인 페이지로 이동
            return;
        }

        // 작성한 내용 서버로 전송
        const response = await axios.post('http://localhost/timeline/write',
            {
                day: formData.date,
                time_title: formData.title,
                time_content: formData.content,
                time_public_yn: formData.isPublic
            },
            {
                headers: { Authorization: token }
            }
        );

        // 작성 성공 시 타임라인 페이지로 이동
        if (response.data.loginYN === 'success') {
            router.push('/profile/timeline');
        }
    };

    // 취소 버튼 클릭 시 타임라인 페이지로 이동
    const handleCancel = () => {
        router.push('/profile/timeline');
    };

    // 입력 필드 값 변경 처리
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="write-page">
            <div className="write-container">
                <div className="write-header">
                    <h1>타임라인 작성</h1>
                </div>
                <form className="write-form" onSubmit={handleSubmit}>
                    {/* 날짜 입력 */}
                    <div className="form-group">
                        <label htmlFor="date">날짜</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* 제목 입력 */}
                    <div className="form-group">
                        <label htmlFor="title">제목</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="제목을 입력하세요"
                            required
                        />
                    </div>

                    {/* 내용 입력 */}
                    <div className="form-group">
                        <label htmlFor="content">내용</label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="내용을 입력하세요"
                            required
                        />
                    </div>

                    {/* 공개 여부 설정 */}
                    <div className="visibility-toggle">
                        <input
                            type="checkbox"
                            id="isPublic"
                            name="isPublic"
                            checked={formData.isPublic}
                            onChange={handleChange}
                        />
                        <label htmlFor="isPublic">공개 설정</label>
                    </div>

                    {/* 저장/취소 버튼 */}
                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={handleCancel}>
                            취소
                        </button>
                        <button type="submit" className="submit-button">
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
