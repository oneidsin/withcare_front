"use client"; // 클라이언트 컴포넌트로 지정 (Redux 상태 접근을 위해)

import SidebarLayout from '@/components/layout/SidebarLayout';
import Link from "next/link"; // Next.js 페이지 이동
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  // Redux store에서 사용자 정보 가져오기 (예시)
  // 실제 state 경로와 구조에 맞게 수정하세요.
  // const userInfo = useSelector(state => state.user.info);
  // const isLoggedIn = useSelector(state => state.auth.isLoggedIn);

  // --- 예시 더미 데이터 (실제 사용 시 위 주석 해제하고 사용) ---
  const userInfo = {
    profilePicUrl: "/defaultProfileImg.png",
    name: "관리자",
  };
  const isLoggedIn = true; // 로그인 상태 예시
  // ---------------------------------------------------------

  const sidebarContent = (
    <ul>
      <li>
        <Link
          href="/msg"
          className={pathname === '/msg' ? 'active' : ''}
        >
          <AiOutlineMail style={{ marginRight: '5px' }} />받은 쪽지함
        </Link>
      </li>
      <li>
        <Link
          href="/msg/outbox"
          className={pathname === '/msg/outbox' ? 'active' : ''}
        >
          <AiOutlineSend style={{ marginRight: '5px' }} />보낸 쪽지함
        </Link>
      </li>
      <li>
        <Link
          href="/msg/box"
          className={pathname === '/msg/box' ? 'active' : ''}
        >
          <AiOutlineInbox style={{ marginRight: '5px' }} />쪽지 보관함
        </Link>
      </li>
      <li>
        <Link
          href="/msg/block"
          className={pathname === '/msg/block' ? 'active' : ''}
        >
          <AiOutlineEyeInvisible style={{ marginRight: '5px' }} />차단한 사용자
        </Link>
      </li>
    </ul>
  );

  return (
    <SidebarLayout
      profileImage={userInfo.profilePicUrl}
      userName={userInfo.name}
      sidebarContent={sidebarContent}
    >
      {children}
    </SidebarLayout>
  );
}