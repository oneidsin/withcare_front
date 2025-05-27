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
              <Link href="/login">
                <AiOutlineLogin style={{ fontSize: '28px', cursor: 'pointer', marginRight: '18px' }} title="로그인" />
              </Link>
              <Link href="/search">
                <AiOutlineSearch style={{ color: 'black', fontSize: '28px', cursor: 'pointer', marginRight: '18px' }} title="검색" />
              </Link>
              <Link href="/msg">
                <AiOutlineMail style={{ color: 'black', fontSize: '28px', cursor: 'pointer', marginRight: '18px' }} title="메일" />
              </Link>
              <Link href="/alert">
                <AiOutlineBell style={{ color: 'black', fontSize: '28px', cursor: 'pointer', marginRight: '18px' }} title="알림" />
              </Link>
              <Link href="/profile">
                <AiOutlineUser style={{ color: 'black', fontSize: '28px', cursor: 'pointer' }} title="프로필" />
              </Link>
            </div>

          </header>
          <nav>
            <Link href="/post?board_idx=1">공지사항</Link>
            <Link href="/post?board_idx=2">자유 게시판</Link>
            <Link href="/post?board_idx=3">Q&A</Link>
            <Link href="/post?board_idx=4">정보 게시판</Link>
            <Link href="/post?board_idx=5">환우 게시판</Link>
            <Link href="/post?board_idx=6">완치 후의 삶</Link>
          </nav>
          <main className="container">{children}</main>
          <footer>ⓒ 2025 withcare</footer>
        </Provider>
      </body>
    </html>
  );
}
