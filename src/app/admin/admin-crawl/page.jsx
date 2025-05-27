"use client";

import React, { useState, useEffect } from 'react';
import './crawl.css';
import axios from 'axios';

export default function AdminCrawl() {
  const [crawlData, setCrawlData] = useState([]);
  const [tempIntervals, setTempIntervals] = useState({});
  const id = sessionStorage.getItem('id');

  useEffect(() => {
    getCrawlinfo();
  }, []);

  // 크롤링 정보 가져오기
  const getCrawlinfo = async () => {
    try {
      const response = await axios.get(`http://localhost/${id}/crawl/getCrawlInfo`);
      console.log(response);
      setCrawlData(response.data.result);
    } catch (error) {
      console.error('크롤링 정보 가져오기 실패:', error);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);

    const datePart = date.toLocaleDateString('ko-KR').replace(/ /g, ''); // 공백 제거
    const timePart = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false  // 24시간 형식
    });

    return `${datePart} ${timePart}`;
  };

  // 활성 상태 변경
  const handleStatusChange = async (sourceIdx, newStatus) => {
    const newActive = newStatus === 'Y';

    setCrawlData(prev =>
      prev.map(item =>
        item.source_idx === sourceIdx ? { ...item, crawl_yn: newActive } : item
      )
    );

    try {
      await axios.put(`http://localhost/${id}/crawl/updateCrawlYn/${sourceIdx}`, {
        crawl_yn: newStatus
      });
      console.log('활성화 상태 저장 완료');
    } catch (error) {
      alert('활성화 상태 저장 실패');
    }
  };

  // input 값 변경 시 임시 상태에만 저장
  const handleTempIntervalChange = (sourceIdx, value) => {
    setTempIntervals(prev => ({
      ...prev,
      [sourceIdx]: value
    }));
  };

  // 저장 버튼 클릭 시 호출
  const handleSaveInterval = async (sourceIdx) => {
    const newInterval = tempIntervals[sourceIdx];
    if (!newInterval || newInterval < 1) {
      alert('1 이상의 숫자를 입력하세요');
      return;
    }

    try {
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


  // 현재 표시할 수집 주기 값
  const getDisplayInterval = (sourceIdx, actualInterval) => {
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
          {crawlData.map((item) => (
            <tr key={item.source_idx} className={!item.crawl_yn ? 'unread' : ''}>
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
              <td>{item.source_name}</td>
              <td>
                <input
                  type="number"
                  value={getDisplayInterval(item.source_idx, item.crawl_cycle)}
                  onChange={(e) => handleTempIntervalChange(item.source_idx, parseInt(e.target.value))}
                  className="interval-input"
                  min="1"
                  max="168"
                  placeholder="시간"
                />
                <button
                  onClick={() => handleSaveInterval(item.source_idx)}
                  disabled={tempIntervals[item.source_idx] === undefined}
                  className="save-interval-button"
                >
                  저장
                </button>
              </td>

              <td>{formatDate(item.last_crawl_at)}</td>
              <td>{item.crawl_yn ? '활성' : '비활성'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
