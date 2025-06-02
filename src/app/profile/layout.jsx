// /app/profile/layout.jsx
'use client';

import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';
import Link from "next/link";
import { AiOutlineUser} from "react-icons/ai";
import { MdOutlineTimeline } from "react-icons/md";
import { GiStairsGoal } from "react-icons/gi";
import { FaRegIdBadge } from "react-icons/fa";

export default function ProfileLayout({ children }) {
    const pathname = usePathname();
    const [userName, setUserName] = useState('');
    const [profileImage, setProfileImage] = useState('/defaultProfileImg.png');

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

        // 프로필 이미지 정보가 있다면 가져오기
        const storedProfileImage = sessionStorage.getItem("profileImage");
        if (storedProfileImage) {
            setProfileImage(storedProfileImage);
        }
    }, []);

    const sidebarContent = (
        <ul>
            <li>
                <Link href="/profile"
                    className={pathname === '/profile' || pathname === '/profile/update' ? 'active' : ''}>
                    <AiOutlineUser style={{ marginRight: '5px' }} />활동 내역
                </Link>
            </li>
            <li>
                <Link href="/profile/timeline"
                    className={pathname === '/profile/timeline' ? 'active' : ''}>
                    <MdOutlineTimeline style={{ marginRight: '5px' }} />타임라인
                </Link>
            </li>
            <li>
                <Link href="/profile/level"
                    className={pathname === '/profile/level' ? 'active' : ''}>
                    <GiStairsGoal style={{ marginRight: '5px' }} />레벨
                </Link>
            </li>
            <li>
                <Link href="/profile/badge"
                    className={pathname === '/profile/badge' ? 'active' : ''}>
                    <FaRegIdBadge style={{ marginRight: '5px' }} />배지
                </Link>
            </li>
        </ul>
    );

    return (
        <SidebarLayout
            profileImage={profileImage}
            userName={userName}
            sidebarContent={sidebarContent}>
            {children}
        </SidebarLayout>
    );
}
