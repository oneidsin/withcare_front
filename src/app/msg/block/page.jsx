"use client";

import React, { useEffect, useState } from 'react';
import '../msg.css'; // 기존 CSS 재사용
import { useDispatch, useSelector } from 'react-redux';
import { setBlockedUsers, setLoading } from '@/redux/blockUserReducer';
import axios from 'axios';


export default function Block() {
  const dispatch = useDispatch();
  const { list: blockedUsers, loading, error } = useSelector((state) => state.blockedUsers);

  // 페이징
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // 한 페이지에 보여줄 사용자 수



  useEffect(() => {
    const fetchUsers = async () => {
      dispatch(setLoading(true)); // 로딩 시작을 redux에 알림
      try {
        const response = await axios.get(`http://localhost/block/list/${id}`);
        dispatch(setBlockedUsers(response.data)); // 성공 시 데이터를 redux에 저장
      } catch (err) {
        console.log("차단 목록 불러오기 실패", err);
        dispatch(setError(err.message)); // 에러 발생시 에러를 redux에 저장
      }
    };
    fetchUsers(); // 함수 호출
  }, [dispatch]); // dispatch 는 일반적으로 변경되지 않지만, 의존성 배열에 포함하는 것이 좋다.


  // 차단 해제 핸들러 (실제 로직 추가 필요)
  const handleUnblock = (userIdToUnblock) => {
    console.log(`${userIdToUnblock} 사용자를 차단 해제합니다.`);
    // 예: setBlockedUsers(blockedUsers.filter(user => user.id !== userIdToUnblock));
    alert(`${userIdToUnblock} 사용자의 차단을 해제했습니다.`); // 임시 알림
  };

  return (
    <div className='inbox-container'>
      {/* 상단 헤더: 제목만 표시 */}
      <div className='inbox-header'>
        <h1>차단한 사용자</h1>
        {/* 여기서는 별도의 상단 버튼이 필요 없습니다. */}
      </div>

      {/* 차단 사용자 목록 테이블 */}
      <table className='message-table'> {/* 기존 테이블 스타일 재사용 */}
        <thead>
          <tr>
            {/* 체크박스는 필요 없으므로 제거 */}
            <th>사용자 아이디</th>
            <th>차단 날짜</th>
            <th>차단 해제</th>
          </tr>
        </thead>
        <tbody>
          {blockedUsers.length > 0 ? (
            blockedUsers.map((user) => (
              <tr key={user.id}>
                <td className='user-id-cell'>{user.userId}</td> {/* 사용자 아이디 */}
                <td>{user.blockedDate}</td> {/* 차단 날짜 */}
                <td>
                  <button
                    className='unblock-button' // 새로운 버튼 스타일
                    onClick={() => handleUnblock(user.userId)}
                  >
                    차단 해제
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '50px' }}>
                차단한 사용자가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 하단 작성하기 버튼은 필요 없습니다. */}
    </div>
  );
}