"use client";

import React, {useEffect, useState} from 'react';
import { BsTrash } from 'react-icons/bs';
import './msg.css';
import {store} from "@/redux/store";
import {useSelector} from "react-redux";
import {List} from "@mui/material";

export default function Inbox() {
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // 전체 선택/해제 핸들러
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allMessageIds = msg.list.map(message => message.id);
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

  useEffect(() => {callList(1)},[]);

  const callList = async (no) =>{
    store.dispatch({type:'msg/outbox',payload:no});
  };

  let msg = useSelector(state=>{
    return state.msg;
  });

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
                checked={selectedMessages.size === msg.list.length && msg.list.length > 0}
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
          <List 
            msg={msg} 
            selectedMessages={selectedMessages} 
            onSelectOne={handleSelectOne}
          />
        </tbody>
      </table>

      {/* 하단 작성하기 버튼 */}
      <div className='write-container'>
        <button className='write-button'>작성하기</button>
      </div>
    </div>
  );
}