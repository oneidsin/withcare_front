'use client';

import { useEffect, useState } from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import BoardWrite from "./admin-board/page";

export default function BoardPageWrapper() {
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserName(payload.name || payload.id || '');
            } catch (e) {
                console.error("토큰 파싱 실패", e);
            }
        }
    }, []);

    const sidebarContent = (
        <ul>
            <li><a href="/admin/admin-board">게시판 관리</a></li>
            <li><a href="/admin/user">회원 관리</a></li>
        </ul>
    );

    return (
        <SidebarLayout userName={userName} sidebarContent={sidebarContent}>
            <BoardWrite />
        </SidebarLayout>
    );
}
