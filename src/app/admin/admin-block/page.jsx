'use client';

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Pagination, Stack } from '@mui/material'; // Material UI 페이지네이션 컴포넌트
import './admin-block.css';


export default function AdminBlock() {
  const router = useRouter();
  const [blockList, setBlockList] = useState([]); // 차단 목록 데이터를 저장하는 상태
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호를 저장하는 상태
  const [totalPages, setTotalPages] = useState(1); // 전체 페이지 수를 저장하는 상태
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
  }, [currentPage]);


  // 차단 목록 불러오기
  const getBlockList = async (page, id, token) => {
    try {
      const res = await axios.get(`http://localhost/admin/block/list`,
        {
          params: {
            id: id,
            page: page,
            pageSize: pageSize
          },
          headers: {
            Authorization: token
          }
        }
      );
      console.log('API 응답 데이터:', res.data.result.list);
      setBlockList(res.data.result.list);
      setTotalPages(res.data.result.totalPages);
      console.log('총 페이지 수:', res.data.result.totalPages);
    } catch (error) {
      console.error('차단 목록 가져오기 실패:', error);
      alert('차단 목록을 불러오는데 실패했습니다.');
    }
  };

  // 날짜를 한국 형식으로 포맷팅하는 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-'; // 날짜 문자열이 없으면 '-' 반환

    const date = new Date(dateString); // 날짜 객체 생성
    // 날짜 부분만 한국어 형식으로 변환하고 공백 제거
    const datePart = date.toLocaleDateString('ko-KR').replace(/ /g, '');

    return datePart; // 날짜만 반환
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
            차단 내역이 없습니다.
          </td>
        </tr>
      );
    }

    return blockList.map((block) => (
      <tr key={block.block_idx}>
        <td>{block.block_idx}</td>
        <td>
          <span className="detail-link"
            onClick={() => { handleDetailView(block.blocked_id) }}
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
  const handleDetailView = (blocked_id) => {
    // 신고 상세보기 페이지로 이동 (새 탭에서 열기)
    console.log('blocked_id:', blocked_id);
    router.push(`/admin/admin-block/detail?blocked_id=${blocked_id}`);
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