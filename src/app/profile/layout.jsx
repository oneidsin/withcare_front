// /app/profile/layout.jsx

import SidebarLayout from '@/components/layout/SidebarLayout';
import Link from "next/link";
import { AiOutlineUser} from "react-icons/ai";
import { MdOutlineTimeline } from "react-icons/md";
import { GiStairsGoal } from "react-icons/gi";
import { FaRegIdBadge } from "react-icons/fa";

export const metadata = {
    title: "프로필 페이지",
    description: "유저 프로필을 볼 수 있는 페이지",
};

export default function ProfileLayout({ children }) {
    // 유저 정보 더미 데이터 (Redux 연결 전 임시)
    const userInfo = {
        profilePicUrl: "/defaultProfileImg.png",
        name: "관리자",
    };

    const sidebarContent = (
        <ul>
            <li>
                <Link href="/profile">
                    <AiOutlineUser style={{ marginRight: '5px' }} />활동 내역
                </Link>
            </li>
            <li>
                <Link href="/profile/timeline">
                    <MdOutlineTimeline style={{ marginRight: '5px' }} />타임라인
                </Link>
            </li>
            <li>
                <Link href="/profile/level">
                    <GiStairsGoal style={{ marginRight: '5px' }} />레벨
                </Link>
            </li>
            <li>
                <Link href="/profile/badge">
                    <FaRegIdBadge style={{ marginRight: '5px' }} />배지
                </Link>
            </li>
        </ul>
    );

    return (
        <SidebarLayout
            profileImage={userInfo.profilePicUrl}
            userName={userInfo.name}
            sidebarContent={sidebarContent}>
            {children}
        </SidebarLayout>
    );
}
