'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Pagination, Stack } from '@mui/material';
import "../msg.css";

export default function Block() {
  const { id, token } = useSelector((state) => state.blockedUsers);

  const page = useRef(1); // 현재 페이지
  const [pages, setPages] = useState(1); // 전체 페이지 수
  const [list, setList] = useState([]); // 차단 목록
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [error, setError] = useState(''); // 에러 메시지

  useEffect(() => {
    if (id && token) {
      fetchBlockedUsers(page.current);
    }
  }, [id, token]);

  const fetchBlockedUsers = async (p) => {
    setLoading(true);
    setError('');

    try {
      const query = p && p !== 1 ? `?page=${p}` : ''; // 1이면 안 붙이고, 2 이상이면 붙임
      const response = await axios.get(`http://localhost/msg/block/list/${id}${query}`, {
        headers: { Authorization: token }
      });

      const { loginYN, result } = response.data;

      if (loginYN && result) {
        setList(result.list || []);
        setPages(result.totalPage || 1);
        page.current = result.page || 1;
      } else {
        setError('로그인이 필요합니다.');
      }
    } catch (err) {
      setError('차단 목록을 불러오는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blocked_id) => {
    if (!window.confirm("차단을 해제하시겠습니까?")) return;

    try {
      const res = await axios.delete(`http://localhost/msg/block/list/cancel`, {
        headers: { Authorization: token },
        data: { id, blocked_id }
      });

      console.log(res);

      fetchBlockedUsers(page.current);
    } catch (err) {
      console.error("차단 해제 중 오류 발생: ", err);
      alert("차단 해제 중 오류가 발생했습니다.");
    }
  }



  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>차단한 사용자</h1>
      </div>

      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p>현재 페이지: {page.current} / 전체 페이지: {pages}</p>

      <table className="message-table">
        <thead>
          <tr>
            <th>내가 차단한 ID</th>
            <th>차단 날짜</th>
            <th>차단 해제</th>
          </tr>
        </thead>
        <tbody>
          {list.length > 0 ? (
            list.map((user) => (
              <tr key={user.user_block_idx}>
                <td>{user.blocked_id}</td>
                <td>{new Date(user.block_start_date).toLocaleDateString()}</td>
                <td><button className='unblock-button'
                  onClick={() => handleUnblock(user.blocked_id)}>차단 해제</button></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>
                차단한 사용자가 없습니다.
              </td>
            </tr>
          )}
          <tr>
            <td colSpan="3">
              <Stack spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
                <Pagination
                  count={pages}
                  page={page.current}
                  onChange={(e, p) => fetchBlockedUsers(p)}
                />
              </Stack>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
