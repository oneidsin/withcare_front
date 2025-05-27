'use client';

import { useEffect, useState } from "react";
import { BsClipboard } from "react-icons/bs";
import { AiOutlineProfile } from "react-icons/ai";
import { AiOutlineAlert } from "react-icons/ai";
import { AiOutlineEyeInvisible } from "react-icons/ai";
import { AiOutlineBarChart } from "react-icons/ai";
import { AiOutlinePieChart } from "react-icons/ai";
import { usePathname } from 'next/navigation';
import SidebarLayout from "@/components/layout/SidebarLayout";
import Link from "next/link";

export default function AdminCrawl({ children }) {
    const pathname = usePathname();
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
            <li>
                <Link href="/admin/admin-board"
                    className={pathname === '/admin/admin-board' ? 'active' : ''}>
                    <BsClipboard style={{ marginRight: 5 }} />게시판 관리
                </Link>
            </li>
            <li>
                <Link href="/admin/admin-user"
                    className={pathname === '/admin/admin-user' ? 'active' : ''}>
                    <AiOutlineProfile style={{ marginRight: 5 }} />회원 관리
                </Link>
            </li>
            <li>
                <Link href="/admin/admin-report"
                    className={pathname === '/admin/admin-report' ? 'active' : ''}>
                    <AiOutlineAlert style={{ marginRight: 5 }} />신고 관리
                </Link>
            </li>
            <li>
                <Link href="/admin/admin-block"
                    className={pathname === '/admin/admin-block' ? 'active' : ''}>
                    <AiOutlineEyeInvisible style={{ marginRight: 5 }} />차단 관리
                </Link>
            </li>
            <li>
                <Link href="/admin/admin-stat"
                    className={pathname === '/admin/admin-stat' ? 'active' : ''}>
                    <AiOutlineBarChart style={{ marginRight: 5 }} />통계 관리
                </Link>
            </li>
            <li>
                <Link href="/admin/admin-crawl"
                    className={pathname === '/admin/admin-crawl' ? 'active' : ''}>
                    <AiOutlinePieChart style={{ marginRight: 5 }} />크롤링 관리
                </Link>
            </li>

        </ul>
    );

    return (
        <SidebarLayout userName={userName} sidebarContent={sidebarContent}>
            {children}
        </SidebarLayout>
    );
}
