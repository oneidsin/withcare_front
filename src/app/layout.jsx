"use client";

import { useEffect, useState } from "react";
import { AiOutlineLogin, AiOutlineSearch, AiOutlineMail, AiOutlineBell, AiOutlineUser, AiOutlineLogout } from "react-icons/ai";
import './app.css';
import { Provider } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { store } from "@/redux/store";

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();

  // 로그인/로그아웃 상태 동기화
  const syncLoginState = () => {
    const token = sessionStorage.getItem("token");
    const name = sessionStorage.getItem("id");

    if (token && name) {
      setIsLoggedIn(true);
      setUsername(name);
    } else {
      setIsLoggedIn(false);
      setUsername("");
    }
  };

  useEffect(() => {
    syncLoginState();

    // 로그인 성공 alert
    if (sessionStorage.getItem("loginSuccess") === "true") {
      alert("로그인되었습니다.");
      sessionStorage.removeItem("loginSuccess");
    }

    // 로그인 이벤트 수신 (수동 dispatch를 위한)
    const handleLogin = () => syncLoginState();
    window.addEventListener("login", handleLogin);

    return () => {
      window.removeEventListener("login", handleLogin);
    };
  }, []);

  const handleLogout = () => {
    const confirmed = confirm("로그아웃하시겠습니까?");
    if (!confirmed) return;

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("id");
    setIsLoggedIn(false);
    setUsername("");
    alert("로그아웃되었습니다.");
    router.push("/");
  };

  return (
      <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
      <Provider store={store}>
        <header className="header">
          <Link href="/">
            <img src="/logo.png" alt="withcare 로고" className="logo" />
          </Link>

          <div className="header-right">
            {!isLoggedIn ? (
                <Link href="/login">
                  <AiOutlineLogin
                      style={{ fontSize: '28px', cursor: 'pointer', marginRight: '18px' }}
                      title="로그인"
                  />
                </Link>
            ) : (
                <>
                  <span style={{ marginRight: '12px', fontWeight: 'bold' }}>{username}님</span>
                  <AiOutlineLogout
                      style={{ fontSize: '28px', cursor: 'pointer', marginRight: '18px' }}
                      onClick={handleLogout}
                      title="로그아웃"
                  />
                </>
            )}
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
