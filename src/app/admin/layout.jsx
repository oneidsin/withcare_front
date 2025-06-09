'use client';

import { useEffect, useState } from "react";
import { BsClipboard } from "react-icons/bs";
import { AiOutlineProfile } from "react-icons/ai";
import { AiOutlineAlert } from "react-icons/ai";
import { AiOutlineEyeInvisible } from "react-icons/ai";
import { AiOutlineBarChart } from "react-icons/ai";
import { AiOutlinePieChart } from "react-icons/ai";
import { AiFillMedicineBox } from "react-icons/ai";
import { usePathname } from 'next/navigation';
import SidebarLayout from "@/components/layout/SidebarLayout";
import Link from "next/link";

export default function AdminCrawl({ children }) {
    const pathname = usePathname();
    const [userName, setUserName] = useState('');
    const [isMounted, setIsMounted] = useState(false);  // ✅ 추가

    useEffect(() => {
        setIsMounted(true);  // ✅ 추가
    }, []);


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
    }, [isMounted]);

    if (!isMounted) return null;  // ✅ SSR mismatch 완벽 차단

    const sidebarContent = (
        <ul>
            <li>
                <Link href="/admin/admin-board"
                    className={pathname === '/admin/admin-board' ? 'active' : ''}>
                    <BsClipboard style={{ marginRight: 5 }} />게시판 관리
                </Link>
            </li>
            <li>
                <Link href="/admin/admin-member"
                    className={pathname === '/admin/admin-member' ? 'active' : ''}>
                    <AiOutlineProfile style={{ marginRight: 5 }} />회원 관리
                </Link>
            </li>
            <li>
                <Link href="/admin/admin-cancer-stage"
                    className={pathname === '/admin/admin-cancer-stage' ? 'active' : ''}>
                    <AiFillMedicineBox style={{ marginRight: 5 }} />회원 진단 명/병기 관리
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
            <li>
                <Link href="/admin/admin-level"
                      className={pathname === '/admin/admin-level' ? 'active' : ''}>
                    <AiOutlinePieChart style={{ marginRight: 5 }} />레벨 관리
                </Link>
            </li>
            <li>
                <Link href="/admin/admin-badge"
                      className={pathname === '/admin/admin-badge' ? 'active' : ''}>
                    <AiOutlinePieChart style={{ marginRight: 5 }} />배지 관리
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
