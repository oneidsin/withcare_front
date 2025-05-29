"use client";

import React, {useEffect, useRef, useState} from 'react';
import { BsTrash } from 'react-icons/bs';
import '../msg.css';
import axios from "axios";
import {Pagination, Stack} from "@mui/material"; // 받은 쪽지함과 동일한 CSS 사용
import Link from 'next/link';

export default function Outbox() {

  let page = useRef(1); // 현재 페이지 번호 저장
  const [list,setList] = useState([]); // 렌더링 할 쪽지 리스트
  const [pages, setPages] = useState(1); // 전체 페이지 수
  const [selectMsg, setSelectMsg] = useState(new Set()); // 선택한 쪽지 저장

  // 전체 선택/해제 핸들러
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allMessageIds = list.map(message => message.msg_idx); // 전체 msg_idx 수집
      setSelectMsg(new Set(allMessageIds));
    } else {
      setSelectMsg(new Set());
    }
  };

  // 개별 선택 핸들러
  const handleSelectOne = (id) => {
    const newSelected = new Set(selectMsg);
    if (newSelected.has(id)) {
      newSelected.delete(id); // 이미 선택된 경우 해제
    } else {
      newSelected.add(id); // 선택되지 않은 경우 추가
    }
    setSelectMsg(newSelected);
  };

  // 페이지 변경 핸들러
  const handlePageChg = (e, newPage) => {
    page.current = newPage;
    callList(newPage); // ✅ 페이지 변경 시 쪽지 목록 다시 불러오기
  };

  useEffect(() => { // 쪽지 목록 불러오기
    callList(page.current);
  },[]);

  const callList = async (p) => { // 실제 데이터를 서버에서 받아오는 함수
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const {data} = await axios.get(`http://localhost:80/msg/outbox/${id}/${p}`,{headers:{Authorization:token}});
    console.log(data);

    if (data.loginYN && data.outbox) {
      setPages(data.outbox.pages); // 보여줄 수 있는 페이지
      page.current = data.outbox.page; // 현재 페이지

      if (!data.outbox.list || data.outbox.list.length === 0) {
        setList([]);
        return;
      }

      setList(data.outbox.list); // 원본 데이터 저장
    }
  }

  return (
      <div className='inbox-container'>
        {/* 상단 헤더 */}
        <div className='inbox-header'>
          <h1> 📭 보낸 쪽지함 </h1>
          <div className='action-buttons'>
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
            <th>받는 사람</th>
            <th>내 용</th>
            <th>날 짜</th>
            <th>확인</th>
            <th>삭제</th>
          </tr>
          </thead>
          <tbody>
          {/* ✅ JSX는 여기서 렌더링: list.map(...) */}
          {list.map((item) => (
              <tr key={item.msg_idx} className={!item.msg_read ? 'unread' : ''}>
                <td>
                  <input
                      type="checkbox"
                      checked={selectMsg.has(item.msg_idx)}
                      onChange={() => handleSelectOne(item.msg_idx)}
                  />
                </td>
                <td>{item.receiver_id}</td>
                <td className='subject-cell'>
                  <Link href={`/msg/detail?id=${item.msg_idx}&type=outbox`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {item.msg_content.length > 30 
                      ? `${item.msg_content.substring(0, 30)}...` 
                      : item.msg_content}
                  </Link>
                </td>
                <td>{new Date(item.msg_sent_at).toLocaleDateString()}</td>
                <td>{item.msg_read ? '읽음' : '읽지 않음'}</td>
                <td>
                  <button className='icon-button'>
                    <BsTrash />
                  </button>
                </td>
              </tr>
          ))}
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
      </div>
  );
}
