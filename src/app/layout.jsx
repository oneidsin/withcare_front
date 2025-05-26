"use client" // ✅ 반드시 최상단

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
                    <Link href="/login">
                        <span style={{ fontSize: '24px', cursor: 'pointer' }}>로그인</span>
                    </Link>
                </div>

                <div className='header-rt'>
                    {/* 아이콘 추가 */}
                    
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
