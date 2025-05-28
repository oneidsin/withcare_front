"use client";

import React, { useState } from 'react';
import { BsTrash } from 'react-icons/bs';
import '../msg.css';
import {useDispatch, useSelector} from "react-redux"; // 받은 쪽지함과 동일한 CSS 사용

export default function Outbox() {
  const dispatch = useDispatch();
  const [selectMsg, setSelectMsg] = useState(new Set());
  const { list, pages } = useSelector(state => state.msg);

  // 전체 선택/해제 핸들러
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allMessageIds = list.map(message => message.msg_idx);
      setSelectMsg(new Set(allMessageIds));
    } else {
      setSelectMsg(new Set());
    }
  };

  // 개별 선택 핸들러
  const handleSelectOne = (id) => {
    const newSelected = new Set(selectMsg);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectMsg(newSelected);
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