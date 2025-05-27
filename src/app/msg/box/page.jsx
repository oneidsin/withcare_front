"use client";

import React, { useState } from 'react';
import { BsTrash } from 'react-icons/bs';
import '../msg.css'; // 받은 쪽지함과 동일한 CSS 사용

// 보관함용 샘플 데이터 (받은 쪽지, 보낸 쪽지 혼합)
const archivedMessages = [
  { id: 1, type: 'received', counterpart: 'test01', subject: 'Re: 집에 보내 주세요.', date: '2025/05/12' },
  { id: 2, type: 'sent', counterpart: 'user02', subject: '회의 자료 보냈습니다.', date: '2025/05/12' },
  { id: 3, type: 'received', counterpart: 'admin', subject: 'Fwd: 시스템 점검 안내', date: '2025/05/11' },
  { id: 4, type: 'sent', counterpart: 'friend', subject: '이번 주말 약속!', date: '2025/05/11' },
  { id: 5, type: 'received', counterpart: 'company', subject: '(광고) 보관된 메일', date: '2025/05/10' },
  { id: 6, type: 'sent', counterpart: 'test01', subject: '요청하신 파일 전달 (보관)', date: '2025/05/10' },
  { id: 7, type: 'received', counterpart: 'team_lead', subject: '프로젝트 중간 보고', date: '2025/05/09' },
  { id: 8, type: 'sent', counterpart: 'service', subject: '문의 드립니다. (보관)', date: '2025/05/09' },
  { id: 9, type: 'received', counterpart: 'test01', subject: '점심 약속 확정', date: '2025/05/08' },
  { id: 10, type: 'sent', counterpart: 'support', subject: '비밀번호 변경 완료', date: '2025/05/08' },
];

export default function MsgBox() {
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // 전체 선택/해제 핸들러
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allMessageIds = archivedMessages.map(msg => msg.id);
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
        <h1>쪽지 보관함</h1> {/* 제목 변경 */}
        <div className='action-buttons'> {/* 동일한 클래스명 사용 */}
          {/* 보관함에서는 보통 '삭제' 버튼만 사용합니다. */}
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
                checked={selectedMessages.size === archivedMessages.length && archivedMessages.length > 0}
              />
            </th>
            <th>구분</th> {/* '구분' 열 추가 */}
            <th>상대방</th> {/* '상대방' 열 추가 */}
            <th>제 목</th>
            <th>날 짜</th>
            <th>삭제</th> {/* '확인' 대신 '삭제' (또는 필요시 유지/변경) */}
          </tr>
        </thead>
        <tbody>
          {archivedMessages.map((msg) => (
            <tr key={msg.id}> {/* 보관함에서는 '읽음' 상태 구분이 덜 중요할 수 있음 */}
              <td>
                <input
                  type="checkbox"
                  checked={selectedMessages.has(msg.id)}
                  onChange={() => handleSelectOne(msg.id)}
                />
              </td>
              <td>{msg.type === 'received' ? '받은 쪽지' : '보낸 쪽지'}</td> {/* 구분 표시 */}
              <td>{msg.counterpart}</td> {/* 상대방 표시 */}
              <td className='subject-cell'>{msg.subject}</td>
              <td>{msg.date}</td>
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