"use client"; // 클라이언트 컴포넌트로 지정 (Redux 상태 접근을 위해)

import './msg.css';
import Link from "next/link"; // Next.js 페이지 이동
import { AiOutlineMail } from "react-icons/ai";
import { AiOutlineInbox } from "react-icons/ai";
import { AiOutlineSend } from "react-icons/ai";
import { AiOutlineEyeInvisible } from "react-icons/ai";

// 사용자 정보 타입 정의 (예시)
// 실제 Redux store 구조에 맞게 수정하세요.
// type UserInfo = {
//   profilePicUrl: string | null;
//   name: string;
//   isLoggedIn: boolean;
// }

export default function MsgLayout({ children }) {
  // Redux store에서 사용자 정보 가져오기 (예시)
  // 실제 state 경로와 구조에 맞게 수정하세요.
  // const userInfo = useSelector(state => state.user.info);
  // const isLoggedIn = useSelector(state => state.auth.isLoggedIn);

  // --- 예시 더미 데이터 (실제 사용 시 위 주석 해제하고 사용) ---
  const userInfo = {
    profilePicUrl: "https://via.placeholder.com/50", // 예시 이미지 URL
    name: "관리자",
  };
  const isLoggedIn = true; // 로그인 상태 예시
  // ---------------------------------------------------------


  return (
    <div className="msg-layout">
      {/* 왼쪽 사이드바 */}
      <aside className="msg-sidebar">
        {/* 사용자 프로필 */}

        <div className="user-profile">
          {/* 프로필 사진 */}
          <img
            src={'/defaultProfileImg.png'} // 이미지 없을 시 기본 이미지
            alt={""}
            className="profile-pic"
          />
          {/* 사용자 이름 */}
          <div className="user-name">{userInfo.name}</div>
        </div>

        {/* 쪽지 메뉴 */}
        <nav className="msg-nav">
          <ul>
            <li>
              <Link href="/msg">
                <AiOutlineMail style={{ marginRight: '5' }} />받은 쪽지함
              </Link> {/* 쪽지함 메인 */}
            </li>
            <li>
              <Link href="/msg/outbox">
                <AiOutlineSend style={{ marginRight: '5' }} />보낸 쪽지함
              </Link> {/* 예: 보낸 쪽지 페이지 */}
            </li>
            <li>
              <Link href="/msg/box">
                <AiOutlineInbox style={{ marginRight: '5' }} />쪽지 보관함
              </Link> {/* 예: 쪽지 쓰기 페이지 */}
            </li>
            <li>
              <Link href="/msg/box">
                <AiOutlineEyeInvisible style={{ marginRight: '5' }} />차단한 사용자
              </Link> {/* 예: 쪽지 쓰기 페이지 */}
            </li>
            {/* 필요한 다른 메뉴 추가 */}
          </ul>
        </nav>
      </aside>

      {/* 오른쪽 중앙 박스 - 쪽지 내용 표시 영역 */}
      <section className="msg-content-box">
        {children} {/* 여기로 각 페이지(e.g., app/msg/page.jsx, app/msg/sent/page.jsx) 내용이 렌더링됨 */}
      </section>
    </div>
  );
}