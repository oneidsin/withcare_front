"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import './main.css';

// 컴포넌트 가져오기
import PopularSearches from './components/PopularSearches';
import MemberRanking from './components/MemberRanking';
import InfoBoard from './components/InfoBoard';
import RecommendedPosts from './components/RecommendedPosts';

export default function MainPage() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdminPrivilege();
    }, []);

    const checkAdminPrivilege = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:80/admin/check', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });
            const data = await response.json();
            if (data.success) {
                setIsAdmin(data.isAdmin);
            }
        } catch (error) {
            console.error('Error checking admin privilege:', error);
        }
    };

    return (
        <div className="main-layout">
            <div className="top-row">
                {/* 정보 게시판 */}
                <InfoBoard />

                {/* 인기 검색어 + 승급자 */}
                <div className="right-panel">
                    <PopularSearches />
                    <MemberRanking />
                </div>
            </div>

            {/* 추천글 */}
            <RecommendedPosts />

            {/* 관리자 페이지 이동 버튼 - 조건부 렌더링 */}
            {isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Link href="/admin/admin-board">
                        <button className="admin-button">관리자 페이지로 이동</button>
                    </Link>
                </div>
            )}
        </div>
    );
}