"use client";

import { useEffect, useState } from "react";
import './app.css';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Provider } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { store } from "@/redux/store";
import SSEClient from "@/components/SSEClient";
import axios from "axios";

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();
  const [menuBoards, setMenuBoards] = useState([]);

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

    // 로그인 이벤트 수신 (수동 dispatch를 위한)
    const handleLogin = () => syncLoginState();
    window.addEventListener("login", handleLogin);

    axios.get("http://localhost/board/list", {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      params: {
        t: new Date().getTime(), // 쿼리스트링으로 캐시 무효화
      }
    }).then((res) => {
      console.log("불러온 게시판 목록:", res.data);
      const boards = res.data;
      const parents = boards.filter(b => b.parent_board_idx == null && String(b.blind_yn) !== "true");
      const children = boards.filter(b => b.parent_board_idx != null && String(b.blind_yn) !== "true");

      const structured = parents.map((parent) => ({
        ...parent,
        children: children.filter((child) => child.parent_board_idx === parent.board_idx),
      }));

      setMenuBoards(structured);
    });

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
    location.href = "/";
  };

  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <Provider store={store}>
          <SSEClient />
          <header className="header">
            <Link href="/">
              <img src="/logo.png" alt="withcare 로고" className="logo" />
            </Link>
            <div className="header-right">
              {!isLoggedIn ? (
                <Link href="/login">
                  <LoginOutlinedIcon className="top-nav-icon"
                    title="로그인"
                  />
                </Link>
              ) : (
                <>
                  <span className="username-text">{username}님</span>
                  <LogoutOutlinedIcon className="top-nav-icon"
                    onClick={handleLogout}
                    title="로그아웃"
                  />
                </>
              )}
              <Link href="/search">
                <SearchOutlinedIcon className="top-nav-icon" title="검색" />
              </Link>
              <Link href="/msg">
                <EmailOutlinedIcon className="top-nav-icon" title="메일" />
              </Link>
              <Link href="/alert">
                <NotificationsOutlinedIcon className="top-nav-icon" title="알림" />
              </Link>
              <Link href="/profile">
                <AccountCircleOutlinedIcon className="top-nav-icon" title="프로필" />
              </Link>
            </div>
          </header>

          <nav className="top-nav">
            {menuBoards.map((parent) => (
              <div key={parent.board_idx} className="nav-item">
                <Link href={`/post?board_idx=${parent.board_idx}`}>
                  {parent.board_name}
                </Link>
                {parent.children.length > 0 && (
                  <div className="dropdown">
                    {parent.children.map((child) => (
                      <Link
                        key={child.board_idx}
                        href={`/post?board_idx=${child.board_idx}`}
                      >
                        {child.board_name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <main className="container">{children}</main>
          <footer>ⓒ 2025 withcare</footer>
        </Provider>
      </body>
    </html>
  );
}
