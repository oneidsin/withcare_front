"use client";

import React, {useRef, useState, useEffect} from 'react';
import { BsTrash } from 'react-icons/bs';
import '../msg.css';
import Link from "next/link";
import {Pagination, Stack} from "@mui/material";
import axios from "axios";

export default function MsgBox() {
  const pageRef = useRef(1);
  const [selectMsg, setSelectMsg] = useState(new Set());
  const [list,setList] = useState([]);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    console.log('Component mounted, calling callList');
    callList(1);
  }, []);

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
  const handlePageChg = (e, newPage) => {
    pageRef.current = newPage;
    callList(newPage);
  };

  const callList = async (page) => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    
    try {
      // 보관된 쪽지만 가져오기 (보관된 쪽지함 전용 API 사용)
      const response = await axios.get(
        `http://localhost:80/msg/inbox/saved/${id}?page=${page-1}&size=15`, 
        {headers:{Authorization:token}}
      );

      console.log("보관함 API 응답:", response.data); // 응답 확인용 로그

      if (response.data.loginYN) {
        const messages = response.data.inbox || [];
        setPages(response.data.pages || 1);
        pageRef.current = page;
        setList(messages);
      }
    } catch (error) {
      console.error('Error fetching saved messages:', error);
      setList([]);
      setPages(1);
    }
  };

  // 선택한 쪽지 삭제
  const handleDelete = async () => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (selectMsg.size === 0) {
      alert('삭제할 쪽지를 선택해주세요.');
      return;
    }

    if (!window.confirm('선택한 쪽지를 삭제하시겠습니까?')) {
      return;
    }

    // 선택된 모든 쪽지 삭제
    for (const msgId of selectMsg) {
      await axios.put(
        `http://localhost/msg/delete/inbox/${id}/${msgId}`,
        {},
        { headers: { Authorization: token } }
      );
    }

    // 삭제 후 목록 새로고침
    setSelectMsg(new Set());
    callList(pageRef.current);
  };

  // 단일 쪽지 삭제
  const handleSingleDelete = async (msgId) => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (!window.confirm('이 쪽지를 삭제하시겠습니까?')) {
      return;
    }

    await axios.put(
      `http://localhost/msg/delete/inbox/${id}/${msgId}`,
      {},
      { headers: { Authorization: token } }
    );

    // 삭제 후 목록 새로고침
    callList(pageRef.current);
  };

  return (
    <div className='inbox-container'>
      {/* 상단 헤더 */}
      <div className='inbox-header'>
        <h1>📨 쪽지 보관함</h1>
        <div className='action-buttons'>
          <button className='delete-button' onClick={handleDelete}>삭제</button>
        </div>
      </div>

      <p>현재 페이지: {pageRef.current} / 전체 페이지: {Math.max(pages, 1)}</p>

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
          <th>보낸 사람</th>
          <th>내 용</th>
          <th>날 짜</th>
          <th>삭제</th>
        </tr>
        </thead>
        <tbody>
          {(!list || list.length === 0) ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>보관된 쪽지가 없습니다.</td>
            </tr>
          ) : (
            list.map((item) => (
              <tr key={item.msg_idx}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectMsg.has(item.msg_idx)}
                    onChange={() => handleSelectOne(item.msg_idx)}
                  />
                </td>
                <td>{item.sender_id}</td>
                <td className='subject-cell'>
                  <Link href={`/msg/detail?id=${item.msg_idx}&type=inbox`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {item.msg_content.length > 30 
                      ? `${item.msg_content.substring(0, 30)}...` 
                      : item.msg_content}
                  </Link>
                </td>
                <td>{new Date(item.msg_sent_at).toLocaleDateString()}</td>
                <td>
                  <button className='icon-button' onClick={() => handleSingleDelete(item.msg_idx)}>
                    <BsTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pages >= 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <Stack spacing={2} alignItems="center">
            <Pagination
              count={pages}
              page={pageRef.current}
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