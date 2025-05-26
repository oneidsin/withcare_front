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

                {/* ✅ 헤더 우측 기능 영역 */}
                <div className="header-right">
                    {/* 로그인 / 로그아웃 */}
                    <Link href="/login">
                        <span className="emoji">🚪</span>
                    </Link>

                    {/* 검색 */}
                    <Link href="/search">
                        <div className="icon-wrapper">
                            <span className="emoji">🔍</span>
                        </div>
                    </Link>

                    {/* 쪽지 */}
                    <Link href="/messages">
                        <div className="icon-wrapper">
                            <span className="emoji">✉️</span>
                        </div>
                    </Link>

                    {/* 알림 */}
                    <Link href="/notifications">
                        <div className="icon-wrapper">
                            <span className="emoji">🔔</span>
                        </div>
                    </Link>

                    {/* 프로필 */}
                    <Link href="/profile">
                        <span className="emoji">👤</span>
                    </Link>
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
