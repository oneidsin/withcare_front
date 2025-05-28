"use client";

import React, { useEffect, useState } from 'react';
import { BsTrash } from 'react-icons/bs';
import './msg.css';
import { useDispatch, useSelector } from "react-redux";
import { Pagination, Stack } from "@mui/material";
import { fetchInbox } from "@/redux/msgSlice";
import axios from 'axios';

export default function Inbox() {
  const dispatch = useDispatch();
  const { list, pages, currentPage } = useSelector(state => state.msg);
  const [selectMsg, setSelectMsg] = useState(new Set());

  // 쪽지 차단 함수
  const userBlock = async () => {
    const id = sessionStorage.getItem('id');
    const token = sessionStorage.getItem('token');

    // 1. 정확히 하나의 쪽지만 선택되었는지 확인
    if (selectMsg.size !== 1) {
      alert("차단할 사용자의 쪽지를 하나만 선택해주세요.");
      return;
    }

    // 2. 선택된 쪽지의 msg_idx 가져오기
    const selectedMsgId = Array.from(selectMsg)[0]; // Set에서 첫 번째 (유일한) 요소를 가져옴

    // 3. list에서 해당 쪽지를 찾아 sender_id 추출
    const messageToBlock = list.find(message => message.msg_idx === selectedMsgId);

    // 혹시 모를 경우에 대비 (선택된 ID가 list에 없는 경우)
    if (!messageToBlock) {
      alert("선택된 쪽지 정보를 찾을 수 없습니다.");
      return;
    }

    const blocked_id = messageToBlock.sender_id; // 차단할 사용자 ID

    // 4. 사용자에게 차단 여부 확인
    if (!window.confirm(`${blocked_id} 사용자를 차단하시겠습니까?`)) {
      return;
    }

    // 5. 차단 요청 보내기
    try {
      const res = await axios.post(`http://localhost/msg/block`, {
        id: id,
        blocked_id: blocked_id // 추출한 sender_id 사용
      }, {
        headers: { Authorization: token }
      });

      console.log('차단 응답:', res.data); // 응답 데이터 확인
      alert(`${blocked_id} 사용자를 차단했습니다.`);

      // 차단 후 선택 해제 및 목록 새로고침
      setSelectMsg(new Set());
      dispatch(fetchInbox({ id: id, page: currentPage })); // 현재 페이지로 새로고침

    } catch (error) {
      console.error("차단 요청 오류 : ", error);
      // 서버에서 오는 에러 메시지를 보여주는 것이 더 좋을 수 있습니다.
      alert("차단 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

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
    const currentUserId = sessionStorage.getItem('id');
    if (currentUserId) {
      dispatch(fetchInbox({ id: currentUserId, page: 1 }));
    }
  }, [dispatch]); // 초기 로딩시에는 1페이지 표출

  // MessageList 컴포넌트
  const MsgList = () => {

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
                checked={selectMsg.has(item.msg_idx)}
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
      </>
    );
  };

  return (
    <div className='inbox-container'>
      {/* 상단 헤더 */}
      <div className='inbox-header'>
        <h1>받은 쪽지함</h1>
        <div className='action-buttons'>
          <button className='block-button' onClick={() => { userBlock() }}>차단</button>
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
            <th>보낸 사용자</th>
            <th>제 목</th>
            <th>날 짜</th>
            <th>확인</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          <MsgList />
        </tbody>
      </table>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <Stack spacing={2} alignItems="center">
            <Pagination
              count={pages}
              page={currentPage}
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
