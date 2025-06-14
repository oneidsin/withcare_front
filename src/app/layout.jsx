"use client";

import { useEffect, useState, Suspense } from "react";
import './app.css';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Provider } from "react-redux";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { store } from "@/redux/store";
import SSEClient from "@/components/SSEClient";
import NotificationPopup from "@/components/NotificationPopup";
import { NotificationProvider, useNotification } from "@/contexts/NotificationContext";
import axios from "axios";

// useSearchParams를 사용하는 컴포넌트를 분리
function LayoutContent({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuBoards, setMenuBoards] = useState([]);
  const currentBoardIdx = searchParams.get('board_idx');

  // 로그인/로그아웃 상태 동기화
  const syncLoginState = () => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("token");
      const name = sessionStorage.getItem("id");
      if (token && name) {
        setIsLoggedIn(true);
        setUsername(name);
      } else {
        setIsLoggedIn(false);
        setUsername("");
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    syncLoginState();

    // 로그인 이벤트 수신 (수동 dispatch를 위한)
    const handleLogin = () => syncLoginState();
    const handleLogout = () => syncLoginState();

    window.addEventListener("login", handleLogin);
    window.addEventListener("logout", handleLogout);

    const fetchBoards = async () => {
      try {
        const res = await axios.get("http://localhost/board/list", {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          params: {
            t: new Date().getTime(), // 쿼리스트링으로 패치 무효화
          }
        });

        const boards = res.data;
        const parents = boards.filter(b => b.parent_board_idx == null && String(b.blind_yn) !== "true");
        const children = boards.filter(b => b.parent_board_idx != null && String(b.blind_yn) !== "true");

        const structured = parents.map((parent) => ({
          ...parent,
          children: children.filter((child) => child.parent_board_idx === parent.board_idx),
        }));

        setMenuBoards(structured);
      } catch (err) {
        console.error("게시판 목록 불러오기 실패:", err);
        setMenuBoards([]);  // 오류 시 초기화
      }
    };

    fetchBoards();

    return () => {
      window.removeEventListener("login", handleLogin);
      window.removeEventListener("logout", handleLogout);
    };
  }, []);

  const handleLogout = () => {
    const confirmed = confirm("로그아웃하시겠습니까?");
    if (!confirmed) return;

    // 세션 스토리지 정리
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("id");
    sessionStorage.removeItem("loginId");     // 로그인 아이디 제거
    sessionStorage.removeItem("name");        // 이름 정보 제거
    sessionStorage.removeItem("profilePic");  // 프로필 이미지 정보 제거
    sessionStorage.removeItem("signupName");  // 회원가입 임시 이름 제거 (혹시 남아있을 경우)
    sessionStorage.removeItem("user_level");  // 레벨 정보 제거
    sessionStorage.removeItem("loginSuccess"); // 로그인 성공 플래그 제거
    
    // 로컬 스토리지에서 사용자별 정보도 정리
    localStorage.removeItem("user_level_backup");  // 레벨 백업 정보 제거

    setIsLoggedIn(false);
    setUsername("");

    // 사이드바 업데이트를 위한 이벤트 발생
    window.dispatchEvent(new Event('profileUpdated'));

    location.href = "/";
  };

  // 현재 선택된 게시판인지 확인하는 함수
  const isActiveBoard = (boardIdx) => {
    return pathname.startsWith('/post') && currentBoardIdx === String(boardIdx);
  };

  // 부모 게시판에 속한 하위 게시판 중 하나라도 활성화되어 있는지 확인
  const hasActiveChild = (parent) => {
    return parent.children.some(child => isActiveBoard(child.board_idx));
  };

  return (
    <Provider store={store}>
      <NotificationProvider>
        <SSEClient />
        <HeaderComponent
          isLoggedIn={isLoggedIn}
          username={username}
          handleLogout={handleLogout}
        />

        <nav className="top-nav">
          {menuBoards.map((parent) => (
            <div key={parent.board_idx} className="nav-item">
              {parent.children.length > 0 ? (
                <span
                  className={isActiveBoard(parent.board_idx) ? 'active-nav-link' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    alert('하위 게시판을 선택해주세요.');
                  }}
                >
                  {parent.board_name}
                </span>
              ) : (
                <Link
                  href={`/post?board_idx=${parent.board_idx}`}
                  className={isActiveBoard(parent.board_idx) ? 'active-nav-link' : ''}
                >
                  {parent.board_name}
                </Link>
              )}
              {parent.children.length > 0 && (
                <div className={`dropdown ${hasActiveChild(parent) ? 'show-dropdown' : ''}`}>
                  {parent.children.map((child) => (
                    <Link
                      key={child.board_idx}
                      href={`/post?board_idx=${child.board_idx}`}
                      className={isActiveBoard(child.board_idx) ? 'active-nav-link' : ''}
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
      </NotificationProvider>
    </Provider>
  );
}

// 메인 컴포넌트 - Suspense로 래핑
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <Suspense fallback={<div>로딩 중...</div>}>
          <LayoutContent>{children}</LayoutContent>
        </Suspense>
      </body>
    </html>
  );
}

// 헤더 컴포넌트 분리
function HeaderComponent({ isLoggedIn, username, handleLogout }) {
  const { unreadCount, togglePopup, setNotificationList } = useNotification();
  const router = useRouter();

  // unreadCount 변화 디버깅
  useEffect(() => {
    console.log('=== HeaderComponent Context 상태 변화 ===');
    console.log('현재 시간:', new Date().toLocaleTimeString());
    console.log('unreadCount:', unreadCount);
  }, [unreadCount]);

  // 로그인 상태가 변경될 때 알림 가져오기
  useEffect(() => {
    if (isLoggedIn && username) {
      fetchNotifications(username);
    }
  }, [isLoggedIn, username]);

  // 알림 목록 가져오기 함수
  const fetchNotifications = async (userId) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      console.log('API로 알림 목록 가져오기 시작:', userId);

      const response = await axios.get(`http://localhost/noti/list/${userId}`, {
        headers: {
          Authorization: token
        }
      });

      console.log('API 응답:', response.data);

      if (response.data.loginYN && response.data.result) {
        setNotificationList(response.data.result);
      }
    } catch (error) {
      console.error('알림 목록 가져오기 실패:', error);
    }
  };

  const handleNotificationClick = () => {
    console.log('알림 아이콘 클릭 - 팝업 토글 및 알림 새로고침');

    // 팝업 토글
    togglePopup();

    // 로그인된 사용자의 최신 알림 불러오기
    if (username) {
      console.log('최신 알림 불러오기 시작:', username);
      fetchNotifications(username);
    }
  };

  const handleProfileClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push('/login');
      alert('로그인이 필요한 서비스입니다.');
    }
  };

  const handleMessageClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push('/login');
      alert('로그인이 필요한 서비스입니다.');
    }
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
              style={{ marginTop: '6px' }}
            />
          </Link>
        ) : (
          <>
            <span className="username-text">{username}님</span>
            <LogoutOutlinedIcon className="top-nav-icon"
              onClick={handleLogout}
              title="로그아웃"
              style={{ marginTop: '6px', marginRight: '13px' }}
            />
          </>
        )}
        <Link href="/search">
          <SearchOutlinedIcon className="top-nav-icon" title="검색" style={{ marginTop: '6px' }} />
        </Link>
        {isLoggedIn ? (
          <Link href="/msg">
            <EmailOutlinedIcon className="top-nav-icon" title="쪽지" style={{ marginTop: '7px' }} />
          </Link>
        ) : (
          <EmailOutlinedIcon
            className="top-nav-icon"
            title="쪽지"
            onClick={handleMessageClick}
            style={{ cursor: 'pointer', marginTop: '6px' }}
          />
        )}
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
          <AccountCircleOutlinedIcon
            className="top-nav-icon"
            title="프로필"
            onClick={handleProfileClick}
            style={{ cursor: 'pointer' }}
          />
        </Link>
      </div>
    </header>
  );
}
