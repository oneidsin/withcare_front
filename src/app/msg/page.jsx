"use client";

import React, { useEffect, useState } from 'react';
import { BsTrash } from 'react-icons/bs';
import './msg.css';
import { useDispatch, useSelector } from "react-redux";
import { Pagination, Stack } from "@mui/material";
import { fetchInbox } from "@/redux/msgSlice";

export default function Inbox() {
  const dispatch = useDispatch();
  const { list, pages } = useSelector(state => state.msg);
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // 전체 선택/해제 핸들러
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allMessageIds = list.map(message => message.msg_idx);
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

  // 페이지 변경 핸들러
  const handlePageChange = (e, page) => {
    const currentUserId = sessionStorage.getItem('id');
    if (currentUserId) {
      dispatch(fetchInbox({ id: currentUserId }));
    }
  };

  useEffect(() => {
    const currentUserId = sessionStorage.getItem('id');
    if (currentUserId) {
      dispatch(fetchInbox({ id: currentUserId }));
    }
  }, [dispatch]);

  // MessageList 컴포넌트
  const MessageList = () => {

    if (!list || list.length === 0) {
      return <tr><td colSpan={6}>받은 쪽지가 없습니다.</td></tr>;
    }

    return (
      <>
        {list.map(item => (
          <tr key={item.msg_idx} className={!item.msg_read ? 'unread' : ''}>
            <td>
              <input
                type="checkbox"
                checked={selectedMessages.has(item.msg_idx)}
                onChange={() => handleSelectOne(item.msg_idx)}
              />
            </td>
            <td>{item.sender_id}</td>
            <td className='subject-cell'>{item.msg_content}</td>
            <td>{new Date(item.msg_sent_at).toLocaleDateString()}</td>
            <td>{item.msg_read ? '읽음' : '읽지 않음'}</td>
            <td>
              <button className='icon-button'>
                <BsTrash />
              </button>
            </td>
          </tr>
        ))}

        <tr>
          <th colSpan={6}>
            <Stack spacing={2}>
              <Pagination count={pages} onChange={handlePageChange} />
            </Stack>
          </th>
        </tr>
      </>
    );
  };

  return (
      <div className='inbox-container'>
        {/* 상단 헤더 */}
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
                  checked={selectedMessages.size === list.length && list.length > 0}
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
          <MessageList />
          </tbody>
        </table>

        {/* 하단 작성하기 버튼 */}
        <div className='write-container'>
          <button className='write-button'>작성하기</button>
        </div>
      </div>
  );
}
