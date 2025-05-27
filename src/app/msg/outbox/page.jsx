"use client";

import React, { useState } from 'react';
import { BsTrash } from 'react-icons/bs';
import '../msg.css'; // 받은 쪽지함과 동일한 CSS 사용

// 보낸 쪽지함용 샘플 데이터 (받는이, 수신확인 여부 등으로 수정)
const sentMessages = [
  { id: 1, recipient: 'test01', subject: '집에 보내 주세요. (보냄)', date: '2025/05/12', read: true },
  { id: 2, recipient: 'user02', subject: '회의 자료 보냈습니다.', date: '2025/05/12', read: false },
  { id: 3, recipient: 'admin', subject: 'Re: 공지사항 확인했습니다.', date: '2025/05/11', read: true },
  { id: 4, recipient: 'friend', subject: '이번 주말 약속!', date: '2025/05/11', read: true },
  { id: 5, recipient: 'customer', subject: '견적서 발송드립니다.', date: '2025/05/10', read: false },
  { id: 6, recipient: 'test01', subject: '요청하신 파일 전달', date: '2025/05/10', read: true },
  { id: 7, recipient: 'team_lead', subject: '프로젝트 진행 상황 공유', date: '2025/05/09', read: true },
  { id: 8, recipient: 'service', subject: '문의 드립니다.', date: '2025/05/09', read: false },
  { id: 9, recipient: 'test01', subject: '점심 약속 제안', date: '2025/05/08', read: true },
  { id: 10, recipient: 'hr', subject: '휴가 신청서 제출', date: '2025/05/08', read: true },
];

export default function Outbox() {
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // 전체 선택/해제 핸들러
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allMessageIds = sentMessages.map(msg => msg.id);
      setSelectedMessages(new Set(allMessageIds));
    } else {
      setSelectedMessages(new Set());
    }
  };

  // 개별 선택 핸들러
  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMessages(newSelected);
  };

  return (
    <div className='inbox-container'> {/* 동일한 클래스명 사용 */}
      {/* 상단 헤더: 제목 + 버튼 */}
      <div className='inbox-header'> {/* 동일한 클래스명 사용 */}
        <h1>보낸 쪽지함</h1> {/* 제목 변경 */}
        <div className='action-buttons'> {/* 동일한 클래스명 사용 */}
          {/* 보낸 쪽지함에서는 '차단' 버튼이 보통 없으므로 '삭제' 버튼만 남깁니다. */}
          <button className='delete-button'>삭제</button>
        </div>
      </div>

      {/* 쪽지 목록 테이블 */}
      <table className='message-table'> {/* 동일한 클래스명 사용 */}
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedMessages.size === sentMessages.length && sentMessages.length > 0}
              />
            </th>
            <th>받는이</th> {/* '보낸이' -> '받는이' 변경 */}
            <th>제 목</th>
            <th>날 짜</th>
            <th>수신확인</th> {/* '확인' -> '수신확인' 변경 */}
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {sentMessages.map((msg) => (
            // 수신확인 여부에 따라 스타일을 다르게 할 수 있습니다 (예: 'unread' 클래스 활용)
            <tr key={msg.id} className={!msg.read ? 'unread' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedMessages.has(msg.id)}
                  onChange={() => handleSelectOne(msg.id)}
                />
              </td>
              <td>{msg.recipient}</td> {/* 받는이 표시 */}
              <td className='subject-cell'>{msg.subject}</td>
              <td>{msg.date}</td>
              <td>{msg.read ? '읽음' : '읽지 않음'}</td> {/* 수신확인 상태 표시 */}
              <td>
                <button className='icon-button'>
                  <BsTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 하단 작성하기 버튼 */}
      <div className='compose-button-container'> {/* 동일한 클래스명 사용 */}
        <button className='compose-button'>작성하기</button>
      </div>
    </div>
  );
}