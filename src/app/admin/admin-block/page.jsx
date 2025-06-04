'use client';

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Pagination, Stack } from '@mui/material';
import './admin-block.css';

export default function AdminBlock() {
  const router = useRouter();
  const [blockList, setBlockList] = useState([]); // 차단 목록 데이터를 저장하는 상태
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호를 저장하는 상태
  const [totalPages, setTotalPages] = useState(1); // 전체 페이지 수를 저장하는 상태
  const [searchKeyword, setSearchKeyword] = useState(''); // 검색 키워드 상태
  const [sortOrder, setSortOrder] = useState('desc'); // 정렬 순서 상태 (desc: 최신순, asc: 오래된순)
  const pageSize = 10; // 한 페이지에 표시할 항목 수 설정

  // 페이지 진입시 실행
  useEffect(() => {
    const id = sessionStorage.getItem("id"); // 세션에 저장된 사용자 ID
    const token = sessionStorage.getItem("token"); // 세션에 저장된 인증 토큰

    if (id && token) {
      getBlockList(currentPage, id, token); // 차단 목록 가져오기 함수 호출
    } else {
      alert('관리자 로그인이 필요합니다.');
      window.location.href = '/login';
    }
  }, [currentPage, sortOrder]);


  // 차단 목록 불러오기
  const getBlockList = async (page, id, token) => {
    try {
      const params = {
        id: id,
        page: page,
        pageSize: pageSize
      };

      // 검색 키워드가 있을 때만 추가
      if (searchKeyword && searchKeyword.trim() !== '') {
        params.searchKeyword = searchKeyword.trim();
      }

      // 정렬 파라미터 추가
      params.sort = sortOrder;

      const res = await axios.get(`http://localhost/admin/block/list`, {
        params: params,
        headers: {
          Authorization: token
        }
      });
      console.log('API 응답 데이터:', res.data.result.list);
      setBlockList(res.data.result.list);
      setTotalPages(res.data.result.totalPage);
      console.log('총 페이지 수:', res.data.result.totalPage);
    } catch (error) {
      console.error('차단 목록 가져오기 실패:', error);
      alert('차단 목록을 불러오는데 실패했습니다.');
    }
  };

  // 검색 실행 함수
  const handleSearch = () => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    getBlockList(1, id, token);
  };

  // 검색 초기화 함수
  const handleClearSearch = () => {
    setSearchKeyword('');
    setCurrentPage(1);
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    // 검색어를 빈 문자열로 설정한 후 API 호출
    setTimeout(() => {
      getBlockList(1, id, token);
    }, 0);
  };

  // 정렬 변경 함수
  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  };

  // Enter 키 검색 처리
  const handleEnterKey = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // 날짜를 한국 형식으로 포맷팅하는 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-'; // 날짜 문자열이 없으면 '-' 반환

    const date = new Date(dateString); // 날짜 객체 생성
    // 날짜 부분을 한국어 형식으로 변환하고 공백 제거
    const datePart = date.toLocaleDateString('ko-KR').replace(/ /g, '');
    // 시간 부분을 24시간 형식으로 변환
    const timePart = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit', // 시간: 두 자리 숫자
      minute: '2-digit', // 분: 두 자리 숫자
      hour12: false // 24시간 형식 사용
    });

    return `${datePart} ${timePart}`; // 날짜와 시간 조합하여 반환
  };


  // 페이지 변경 시 호출되는 이벤트 핸들러
  const handlePageChange = (event, page) => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    setCurrentPage(page);
    getBlockList(page, id, token); // getReportList에서 getBlockList로 수정
  };

  // 차단 목록 렌더링
  const renderBlockList = () => {
    if (blockList.length === 0) {
      return (
        <tr>
          <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
            {searchKeyword ? '검색 결과가 없습니다.' : '차단 내역이 없습니다.'}
          </td>
        </tr>
      );
    }

    return blockList.map((block) => (
      <tr key={block.block_idx}>
        <td>{block.block_idx}</td>
        <td>
          <span className="detail-link"
            onClick={() => { handleDetailView(block.block_idx, block.blocked_id) }}
            title="상세보기">
            {block.blocked_id}
          </span>
        </td>
        <td>{block.block_admin_id}</td>
        <td>{formatDate(block.block_start_date)}</td>
        <td>{formatDate(block.block_end_date)}</td>
      </tr>
    ));
  };

  // 차단 상세보기 페이지로 이동 (새 탭에서 열기)
  const handleDetailView = (block_idx, blocked_id) => {
    console.log('block_idx:', block_idx);
    console.log('blocked_id:', blocked_id);
    router.push(`/admin/admin-block/detail?block_idx=${block_idx}&blocked_id=${blocked_id}`);
  };

  // 페이지네이션 렌더링 함수
  const renderPagination = () => {
    if (blockList.length === 0) return null;

    return (
      <tr>
        <td colSpan="5">
          <Stack spacing={2} sx={{ alignItems: 'center', mt: 2, mb: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
            />
          </Stack>
        </td>
      </tr>
    );
  };


  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>차단 관리</h1>
      </div>

      {/* 검색 및 정렬 섹션 */}
      <div className="search-sort-section">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="차단된 아이디 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyUp={handleEnterKey}
          />
          <button className="search-button" onClick={handleSearch}>
            검색
          </button>
          {searchKeyword && (
            <button className="clear-search-button" onClick={handleClearSearch}>
              검색 초기화
            </button>
          )}
        </div>

        <div className="sort-container">
          <label htmlFor="sort-select">정렬:</label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortOrder}
            onChange={handleSortChange}
          >
            <option value="desc">차단 종료일 최신순</option>
            <option value="asc">차단 종료일 오래된순</option>
          </select>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>차단한 ID</th>
            <th>차단을 실행한 관리자</th>
            <th>차단 시작일</th>
            <th>차단 종료일</th>
          </tr>
        </thead>
        <tbody>
          {renderBlockList()}
          {renderPagination()}
        </tbody>
      </table>
    </div>
  );
}