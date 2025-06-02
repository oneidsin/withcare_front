"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import NotificationPopup from "@/components/NotificationPopup";
import { togglePopup, fetchNotifications, addNotification } from "@/redux/notificationSlice";
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

    // 모든 세션 데이터 정리
    sessionStorage.clear(); // 한 번에 모든 데이터 삭제

    // 상태 초기화
    setIsLoggedIn(false);
    setUsername("");

    // 사이드바 및 다른 컴포넌트 업데이트를 위한 이벤트 발생
    window.dispatchEvent(new Event('profileUpdated'));
    window.dispatchEvent(new Event('logout'));

    // 메인 페이지로 이동
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
          <HeaderComponent
            isLoggedIn={isLoggedIn}
            username={username}
            handleLogout={handleLogout}
          />

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

// 헤더 컴포넌트 분리
function HeaderComponent({ isLoggedIn, username, handleLogout }) {
  const dispatch = useDispatch();
  const { unreadCount } = useSelector(state => state.notification);

  // unreadCount 변화 디버깅
  useEffect(() => {
    console.log('HeaderComponent - unreadCount 변화:', unreadCount);
  }, [unreadCount]);

  // 로그인 상태가 변경될 때 알림 가져오기
  useEffect(() => {
    if (isLoggedIn && username) {
      // 로그인 시 알림 목록 가져오기
      dispatch(fetchNotifications({ id: username, offset: 0 }));
    }
  }, [isLoggedIn, username, dispatch]);

  const handleNotificationClick = () => {
    dispatch(togglePopup());
  };

  return (
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
        <div className="notification-container">
          <NotificationsOutlinedIcon
            className="top-nav-icon"
            title="알림"
            onClick={handleNotificationClick}
          />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
          <NotificationPopup />
        </div>
        <Link href="/profile">
          <AccountCircleOutlinedIcon className="top-nav-icon" title="프로필" />
        </Link>
      </div>
    </header>
  );
}
