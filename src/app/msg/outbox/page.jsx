"use client";

import React, {useEffect, useRef, useState} from 'react';
import { BsTrash } from 'react-icons/bs';
import '../msg.css';
import axios from "axios";
import {Pagination, Stack} from "@mui/material"; // 받은 쪽지함과 동일한 CSS 사용

export default function Outbox() {

  let page = useRef(1);
  const [list,setList] = useState([]);
  const [pages, setPages] = useState(1);
  const [selectMsg, setSelectMsg] = useState(new Set());

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

  // 페이지 변경 핸들러
  const handlePageChg = (e, page) => {
    const currentUserId = sessionStorage.getItem('id');
    if (currentUserId) {
      dispatch(fetchInbox({ id: currentUserId, page }));
    }
  };

  useEffect(() => {
    callList(page.current);
  },[]);

  const callList = async (p) => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const {data} = await axios.get(`http://localhost:80/msg/outbox/${id}/${p}`,{headers:{Authorization:token}});
    console.log(data);
    
    if (data.loginYN && data.outbox) {
      setPages(data.outbox.pages); // 보여줄 수 있는 페이지
      page.current = data.outbox.page; // 현재 페이지

      if (!data.outbox.list || data.outbox.list.length === 0) {
        setList([<tr key="empty"><td colSpan={6}>보낸 쪽지가 없습니다.</td></tr>]);
        return;
      }

      const content = data.outbox.list.map((item) => (
        <tr key={item.msg_idx} className={!item.msg_read ? 'unread' : ''}>
          <td>
            <input
              type="checkbox"
              checked={selectMsg.has(item.msg_idx)}
              onChange={() => handleSelectOne(item.msg_idx)}
            />
          </td>
          <td>{item.receiver_id}</td>
          <td className='subject-cell'>{item.msg_content}</td>
          <td>{new Date(item.msg_sent_at).toLocaleDateString()}</td>
          <td>{item.msg_read ? '읽음' : '읽지 않음'}</td>
          <td>
            <button className='icon-button'>
              <BsTrash />
            </button>
          </td>
        </tr>
      ));
      setList(content);
    } else {
      setList([<tr key="error"><td colSpan={6}>데이터를 불러올 수 없습니다.</td></tr>]);
    }
  }

  return (
      <div className='inbox-container'>
        {/* 상단 헤더 */}
        <div className='inbox-header'>
          <h1>보낸 쪽지함</h1>
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
                  checked={selectMsg.size === list.length && list.length > 0}
              />
            </th>
            <th>받은 사용자</th>
            <th>제 목</th>
            <th>날 짜</th>
            <th>확인</th>
            <th>삭제</th>
          </tr>
          </thead>
          <tbody>
            {list}
          </tbody>
        </table>

        {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Stack spacing={2} alignItems="center">
                <Pagination
                    count={pages}
                    page={page.current}
                    onChange={handlePageChg}
                    color="primary"
                    showFirstButton
                    showLastButton
                />
              </Stack>
            </div>
        )}

        {/* 하단 작성하기 버튼 */}
        <div className='write-container'>
          <button className='write-button'>작성하기</button>
        </div>
      </div>
  );


}