"use client";

import React, { useState } from 'react';
import { BsTrash } from 'react-icons/bs';
import './msg.css';

// 샘플 데이터를 10개로 늘립니다.
const messages = [
  { id: 1, sender: 'test01', subject: '집에 보내 주세요.', date: '2025/05/12', read: true },
  { id: 2, sender: 'user02', subject: '회의 자료 공유합니다.', date: '2025/05/12', read: false },
  { id: 3, sender: 'admin', subject: '공지사항: 시스템 점검 안내', date: '2025/05/11', read: true },
  { id: 4, sender: 'friend', subject: '주말에 뭐해?', date: '2025/05/11', read: false },
  { id: 5, sender: 'company', subject: '(광고) 특별 할인 이벤트!', date: '2025/05/10', read: true },
  { id: 6, sender: 'test01', subject: '지난 번 요청 건 관련', date: '2025/05/10', read: true },
  { id: 7, sender: 'team_lead', subject: '프로젝트 진행 상황 보고 요청', date: '2025/05/09', read: false },
  { id: 8, sender: 'service', subject: '문의하신 내용에 대한 답변입니다.', date: '2025/05/09', read: true },
  { id: 9, sender: 'test01', subject: '점심 식사 같이 하시죠!', date: '2025/05/08', read: false },
  { id: 10, sender: 'support', subject: '비밀번호 변경 안내', date: '2025/05/08', read: true },
];

export default function Inbox() {
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // 전체 선택/해제 핸들러
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allMessageIds = messages.map(msg => msg.id);
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
    <div className='inbox-container'>
      {/* 상단 헤더: 제목 + 버튼 */}
      <div className='inbox-header'>
        <h1>받은 쪽지함</h1>
        <div className='action-buttons'>
          <button className='block-button'>차단</button>
          <button className='delete-button'>삭제</button>
        </div>
      </div>

      {/* 쪽지 목록 테이블 */}
      <table className='message-table'>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedMessages.size === messages.length && messages.length > 0}
              />
            </th>
            <th>보낸이</th>
            <th>제 목</th>
            <th>날 짜</th>
            <th>확인</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg.id} className={!msg.read ? 'unread' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedMessages.has(msg.id)}
                  onChange={() => handleSelectOne(msg.id)}
                />
              </td>
              <td>{msg.sender}</td>
              <td className='subject-cell'>{msg.subject}</td>
              <td>{msg.date}</td>
              <td>{msg.read ? '읽음' : '읽지 않음'}</td>
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
      <div className='compose-button-container'>
        <button className='compose-button'>작성하기</button>
      </div>
    </div>
  );
}