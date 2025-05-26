"use client" // ✅ 반드시 최상단

import { AiOutlineLogin } from "react-icons/ai";
import { AiOutlineSearch } from "react-icons/ai";
import { AiOutlineMail } from "react-icons/ai";
import { AiOutlineBell } from "react-icons/ai";
import { AiOutlineUser } from "react-icons/ai";
import './app.css'
import { Provider } from "react-redux";
import Link from "next/link";
import { store } from "@/redux/store";

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
        <head>
            <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        </head>
        <body>
        <Provider store={store}> {/* ✅ Provider는 클라이언트 컴포넌트 안에서만 가능 */}
            <header className="header">
                <Link href="/">
                <img src="/logo.png" alt="withcare 로고" className="logo" />
                </Link>

                <div className="header-right">
                    {/* 아이콘 추가 */}
                    <AiOutlineLogin style={{ fontSize: '28px', cursor: 'pointer', marginRight: '18px' }} title="로그아웃" />
                    <AiOutlineSearch style={{ fontSize: '28px', cursor: 'pointer', marginRight: '18px' }} title="검색" />
                    <AiOutlineMail style={{ fontSize: '28px', cursor: 'pointer', marginRight: '18px' }} title="메일" />
                    <AiOutlineBell style={{ fontSize: '28px', cursor: 'pointer', marginRight: '18px' }} title="알림" />
                    <AiOutlineUser style={{ fontSize: '28px', cursor: 'pointer' }} title="프로필" />
                </div>
                    
            </header>
            <nav>
                <a href="#">공지사항</a>
                <a href="#">자유 게시판</a>
                <a href="#">Q&A</a>
                <a href="#">정보 게시판</a>
                <a href="#">환우 게시판</a>
                <a href="#">완치 후의 삶</a>
                <a href="#">랭킹</a>
            </nav>
            <main className="container">{children}</main>
            <footer>ⓒ 2025 withcare</footer>
        </Provider>
        </body>
        </html>
    );
}
