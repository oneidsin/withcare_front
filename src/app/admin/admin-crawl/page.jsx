"use client";

import React, { useState } from 'react';
import './crawl.css';
import axios from 'axios';

const crawlSites = [
  { id: 1, name: '암정보센터', url: 'https://www.cancer.go.kr', lastCrawled: '2025/05/25', active: true, crawlInterval: 24 },
  { id: 2, name: '서울아산병원', url: 'https://www.amc.seoul.kr', lastCrawled: '2025/05/26', active: true, crawlInterval: 12 },
  { id: 3, name: '국립암센터', url: 'https://www.ncc.re.kr', lastCrawled: '2025/05/23', active: false, crawlInterval: 48 },
  { id: 4, name: '건강보험심사평가원', url: 'https://www.hira.or.kr', lastCrawled: '2025/05/22', active: true, crawlInterval: 6 },
];

export default function AdminCrawl() {
  const [sites, setSites] = useState(crawlSites);
  const [tempIntervals, setTempIntervals] = useState({});

  const getCrawlinfo = async () => {
    const response = await axios.get(`http://localhost/${id}/crawl/getCrawlInfo`);
    console.log(response);
  }


  // 개별 사이트 활성화 상태 변경 (실시간 저장)
  const handleStatusChange = async (siteId, newStatus) => {
    const newActive = newStatus === 'Y';

    // 즉시 UI 업데이트
    setSites(prevSites =>
      prevSites.map(site => {
        if (site.id === siteId) {
          return { ...site, active: newActive };
        }
        return site;
      })
    );

    // 실시간 저장 로직 (실제 API 호출)
    try {
      console.log(`사이트 ${siteId} 활성화 상태 저장:`, newActive);
      // 여기에 실제 API 호출 코드 추가
      // await updateSiteStatus(siteId, newActive);
    } catch (error) {
      console.error('활성화 상태 저장 실패:', error);
      // 실패시 원래 상태로 되돌리기
    }
  };

  // 임시 수집 주기 변경
  const handleTempIntervalChange = (siteId, newInterval) => {
    setTempIntervals(prev => ({
      ...prev,
      [siteId]: newInterval
    }));
  };

  // 수집 주기 일괄 저장
  const handleSaveIntervals = async () => {
    if (Object.keys(tempIntervals).length === 0) {
      alert('변경된 수집 주기가 없습니다.');
      return;
    }

    try {
      // 변경된 수집 주기들을 실제 상태에 반영
      setSites(prevSites =>
        prevSites.map(site => {
          if (tempIntervals[site.id] !== undefined) {
            const newInterval = parseInt(tempIntervals[site.id]);
            if (newInterval > 0) {
              return { ...site, crawlInterval: newInterval };
            }
          }
          return site;
        })
      );

      // 임시 상태 초기화
      setTempIntervals({});

      console.log('수집 주기 일괄 저장:', tempIntervals);
      alert('수집 주기가 저장되었습니다.');

      // 여기에 실제 API 호출 코드 추가
      // await updateCrawlIntervals(tempIntervals);
    } catch (error) {
      console.error('수집 주기 저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  // 현재 표시할 수집 주기 값 (임시값이 있으면 임시값, 없으면 실제값)
  const getDisplayInterval = (siteId, actualInterval) => {
    return tempIntervals[siteId] !== undefined ? tempIntervals[siteId] : actualInterval;
  };

  // 변경사항이 있는지 확인
  const hasChanges = Object.keys(tempIntervals).length > 0;

  return (
    <div className='inbox-container'>
      {/* 상단 헤더 */}
      <div className='inbox-header'>
        <h1>크롤링 관리</h1>
        <div className='action-buttons'>
          <button
            className='save-button'
            onClick={handleSaveIntervals}
            disabled={!hasChanges}
          >
            수집 주기 저장
          </button>
        </div>
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
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site.id} className={!site.active ? 'unread' : ''}>
              <td>
                <select
                  value={site.active ? 'Y' : 'N'}
                  onChange={(e) => handleStatusChange(site.id, e.target.value)}
                  className="status-select"
                >
                  <option value="Y">Y</option>
                  <option value="N">N</option>
                </select>
              </td>
              <td>{site.name}</td>
              <td>
                <input
                  type="number"
                  value={getDisplayInterval(site.id, site.crawlInterval)}
                  onChange={(e) => handleTempIntervalChange(site.id, e.target.value)}
                  className="interval-input"
                  min="1"
                  max="168"
                  placeholder="시간"
                />
              </td>
              <td>{site.lastCrawled}</td>
              <td>{site.active ? '활성' : '비활성'}</td>
              <td>
                <button className='icon-button'>수정</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
