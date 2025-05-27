"use client";

import React, { useState } from 'react';
import '../msg.css'; // 기존 CSS 재사용

// 차단한 사용자 샘플 데이터
const blockedUsersList = [
  { id: 1, userId: 'block_user_01', blockedDate: '2025/05/01' },
  { id: 2, userId: 'spammer_xyz', blockedDate: '2025/04/22' },
  { id: 3, userId: 'annoying_123', blockedDate: '2025/03/10' },
  { id: 4, userId: 'test_block_4', blockedDate: '2025/02/15' },
  { id: 5, userId: 'user_no_more', blockedDate: '2025/01/30' },
];

export default function Block() {
  // 실제 구현 시에는 상태 관리를 통해 목록을 업데이트해야 합니다.
  const [blockedUsers, setBlockedUsers] = useState(blockedUsersList);

  // 차단 해제 핸들러 (실제 로직 추가 필요)
  const handleUnblock = (userIdToUnblock) => {
    console.log(`${userIdToUnblock} 사용자를 차단 해제합니다.`);
    // 예: setBlockedUsers(blockedUsers.filter(user => user.id !== userIdToUnblock));
    alert(`${userIdToUnblock} 사용자의 차단을 해제했습니다.`); // 임시 알림
  };

  return (
    <div className='inbox-container'>
      {/* 상단 헤더: 제목만 표시 */}
      <div className='inbox-header'>
        <h1>차단한 사용자</h1>
        {/* 여기서는 별도의 상단 버튼이 필요 없습니다. */}
      </div>

      {/* 차단 사용자 목록 테이블 */}
      <table className='message-table'> {/* 기존 테이블 스타일 재사용 */}
        <thead>
          <tr>
            {/* 체크박스는 필요 없으므로 제거 */}
            <th>사용자 아이디</th>
            <th>차단 날짜</th>
            <th>차단 해제</th>
          </tr>
        </thead>
        <tbody>
          {blockedUsers.length > 0 ? (
            blockedUsers.map((user) => (
              <tr key={user.id}>
                <td className='user-id-cell'>{user.userId}</td> {/* 사용자 아이디 */}
                <td>{user.blockedDate}</td> {/* 차단 날짜 */}
                <td>
                  <button
                    className='unblock-button' // 새로운 버튼 스타일
                    onClick={() => handleUnblock(user.userId)}
                  >
                    차단 해제
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '50px' }}>
                차단한 사용자가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 하단 작성하기 버튼은 필요 없습니다. */}
    </div>
  );
}