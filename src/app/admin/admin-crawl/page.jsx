"use client";

import React, { useState, useEffect } from 'react';
import './crawl.css';
import axios from 'axios';

export default function AdminCrawl() {
  const [crawlData, setCrawlData] = useState([]); // 서버에서 받아온 크롤링 테이블 정보를 저장
  const [tempIntervals, setTempIntervals] = useState({}); // 사용자가 입력 중인 수집 주기 값을 임시 저장
  const id = sessionStorage.getItem('id'); // 세션스토리지에서 id 가져오기

  // 페이지 진입시 실행
  useEffect(() => {
    if (id) {
      getCrawlinfo();
    } else {
      alert('관리자 로그인이 필요합니다.');
      window.location.href = '/login';
    }
  }, []);

  // 크롤링 정보 가져오기
  const getCrawlinfo = async () => {
    try {
      const response = await axios.get(`http://localhost/${id}/crawl/getCrawlInfo`);
      console.log(response);
      setCrawlData(response.data.result); // 응답받은 데이터를 state에 저장
    } catch (error) {
      console.error('크롤링 정보 가져오기 실패:', error);
    }
  };


  // ====== 유틸리티 함수 ======
  // 날짜 포맷팅(한국식)
  const formatDate = (dateString) => {
    if (!dateString) return '-'; // null 이나 undefined 일 경우 '-' 로 표시

    const date = new Date(dateString); // 날짜 객체 생성

    const datePart = date.toLocaleDateString('ko-KR').replace(/ /g, ''); // 공백 제거
    const timePart = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false  // 24시간 형식
    });

    return `${datePart} ${timePart}`;
  };

  // ====== 이벤트 핸들러 ======
  // 활성 상태 변경(드롭다운에서 Y/N 선택시)
  const handleStatusChange = async (sourceIdx, newStatus) => {
    const newActive = newStatus === 'Y';

    // 먼저 화면에 즉시 반영
    setCrawlData(prev =>
      prev.map(item =>
        // 해당 idx 값과 일치하는 항목만 crawl_yn 값 변경
        item.source_idx === sourceIdx ? { ...item, crawl_yn: newActive } : item
      )
    );

    // 서버에 저장
    try {
      await axios.put(`http://localhost/${id}/crawl/updateCrawlYn/${sourceIdx}`, {
        crawl_yn: newStatus
      });
      console.log('활성화 상태 저장 완료');
    } catch (error) {
      alert('활성화 상태 저장 실패');
    }
  };

  // input 값 변경 시 임시 상태에만 저장(서버에는 아직 저장 안 함)
  const handleTempIntervalChange = (sourceIdx, value) => {
    setTempIntervals(prev => ({
      ...prev,
      [sourceIdx]: value // 해당 소스 idx의 임시 값만 업데이트
    }));
  };

  // 저장 버튼 클릭 시 호출(서버에 저장)
  const handleSaveInterval = async (sourceIdx) => {
    const newInterval = tempIntervals[sourceIdx]; // 임시 상태에서 가져온 값
    // 입력값 검증 : 1 이상이어야 함
    if (!newInterval || newInterval < 1) {
      alert('1 이상의 숫자를 입력하세요');
      return;
    }

    try {
      // 서버에 주기 설정 업데이트 요청
      await axios.put(`http://localhost/${id}/crawl/updateCrawlCycle/${sourceIdx}`, {
        crawl_cycle: newInterval
      });
      alert('수집 주기 저장 완료');

      // 저장 후 임시 상태에서 제거
      setTempIntervals(prev => {
        const newState = { ...prev };
        delete newState[sourceIdx];
        return newState;
      });

      // 데이터 다시 불러오기
      getCrawlinfo();
    } catch (error) {
      alert('수집 주기 저장 실패');
    }
  };


  // ====== 렌더링 관련 함수 ======
  // 현재 input 에 표시할 수집 주기 값
  const getDisplayInterval = (sourceIdx, actualInterval) => {
    // 임시 상태에 값이 있으면 임시 상태 값 사용, 없으면 실제(DB) 값 사용
    return tempIntervals[sourceIdx] !== undefined ? tempIntervals[sourceIdx] : actualInterval;
  };

  // 변경사항이 있는지 확인
  const hasChanges = Object.keys(tempIntervals).length > 0;

  return (
    <div className='inbox-container'>
      {/* 상단 헤더 */}
      <div className='inbox-header'>
        <h1>크롤링 관리</h1>
      </div>

      {/* 크롤링 사이트 테이블 */}
      <table className='message-table'>
        <thead>
          <tr>
            <th>활성화 여부</th>
            <th>사이트 이름</th>
            <th>수집 주기 설정 (시간)</th>
            <th>마지막 크롤링</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {/* crawlData 배열을 순회하면서 각 크롤링 소스를 테이블 행으로 렌더링 */}
          {crawlData.map((item) => (  // 비활성화된 항목은 'unread' 클래스 추가 (시각적 구분)
            <tr key={item.source_idx} className={!item.crawl_yn ? 'unread' : ''}>
              {/* 활성화 여부 드롭다운 */}
              <td>
                <select
                  value={item.crawl_yn ? 'Y' : 'N'}
                  onChange={(e) => handleStatusChange(item.source_idx, e.target.value)}
                  className="status-select"
                >
                  <option value="Y">Y</option>
                  <option value="N">N</option>
                </select>
              </td>
              {/* 사이트 이름 */}
              <td>{item.source_name}</td>

              {/* 수집 주기 설정 */}
              <td>
                <input
                  type="number" // 임시 값이 있으면 표시, 없으면 DB 값 표시
                  value={getDisplayInterval(item.source_idx, item.crawl_cycle)}
                  onChange={(e) => handleTempIntervalChange(item.source_idx, parseInt(e.target.value))}
                  className="interval-input"
                  min="1" // 최소 1시간
                  max="168" // 최대 168시간(7일)
                  placeholder="시간"
                />
                <button
                  onClick={() => handleSaveInterval(item.source_idx)}
                  // 임시 상태에 값이 있을 때만 저장 버튼 활성화
                  disabled={tempIntervals[item.source_idx] === undefined}
                  className="save-interval-button"
                >
                  저장
                </button>
              </td>

              {/* 마지막 크롤링 날짜 */}
              <td>{formatDate(item.last_crawl_at)}</td>

              {/* 상태 표시 */}
              <td>{item.crawl_yn ? '활성' : '비활성'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
