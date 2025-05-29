"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Pagination, Stack } from '@mui/material';
import "../admin_report.css";

export default function AdminReportHistory() {
  // 상태 관리
  const [historyList, setHistoryList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryList, setCategoryList] = useState([]);
  const [filters, setFilters] = useState({
    reporterId: '',
    reportedId: '',
    category: '',
    reportType: '',
    sortOrder: 'desc'
  });
  const pageSize = 10;

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (id) {
      getReportHistory(currentPage, id, token);
      getCategoryList(id, token); // 카테고리 목록도 함께 가져오기
    } else {
      alert("관리자 로그인이 필요합니다.");
      window.location.href = '/login';
    }
  }, [currentPage, filters]);

  // 카테고리 목록 가져오기
  const getCategoryList = async (id, token) => {
    try {
      const res = await axios.get(`http://localhost/admin/report-manage/report-cate-list`, {
        params: { id },
        headers: { Authorization: token }
      });

      if (res.data.result) {
        setCategoryList(res.data.result);
        console.log('카테고리 목록:', res.data.result);
      }
    } catch (error) {
      console.error("카테고리 목록 가져오기 실패:", error);
    }
  };

  // 신고 히스토리 목록 불러오기
  const getReportHistory = async (page, id, token) => {
    try {
      const params = {
        id: id,
        page: page,
        pageSize: pageSize,
        ...filters
      };

      // 빈 값인 필터는 제거
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const res = await axios.get(`http://localhost/admin/report/history`, {
        params: params,
        headers: {
          Authorization: token
        }
      });

      console.log('response:', res);

      if (res.data.loginYN) {
        const result = res.data.result;
        setHistoryList(result.list || []);
        setTotalPages(result.totalPage || 1);
        setCurrentPage(result.page || page);
        console.log('result:', result);
      } else {
        alert('관리자 로그인이 필요합니다.');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error("신고 히스토리 목록 불러오기 실패:", error);
      alert("신고 히스토리 목록을 불러오는데 실패했습니다.");
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('ko-KR').replace(/ /g, '');
    const timePart = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${datePart} ${timePart}`;
  };

  // 카테고리 번호를 카테고리 이름으로 변환하는 함수
  const getCategoryName = (cateIdx) => {
    if (!cateIdx) return '-';
    const category = categoryList.find(cat => cat.rep_cate_idx === cateIdx);
    return category ? category.rep_cate_name : cateIdx;
  };

  // 필터 변경 핸들러
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      reporterId: '',
      reportedId: '',
      category: '',
      reportType: '',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  // 히스토리 목록 렌더링
  const renderHistoryList = () => {
    if (historyList.length === 0) {
      return (
        <tr>
          <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
            신고 히스토리가 없습니다.
          </td>
        </tr>
      );
    }

    return historyList.map((history) => (
      <tr key={history.rep_idx}>
        <td>{history.rep_idx}</td>
        <td>{history.reporter_id}</td>
        <td>{history.reported_id}</td>
        <td>{getCategoryName(history.rep_cate_idx)}</td>
        <td>{history.rep_item_type}</td>
        <td>{formatDate(history.report_at)}</td>
        <td>{formatDate(history.process_date)}</td>
        <td>{history.rep_admin_id}</td>
      </tr>
    ));
  };

  // 페이지네이션 렌더링
  const renderPagination = () => {
    if (historyList.length === 0) return null;

    return (
      <tr>
        <td colSpan="8">
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
        <h1>신고 히스토리</h1>
      </div>

      {/* 필터 섹션 */}
      <div className="filter-section" style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>신고자 ID:</label>
            <input
              type="text"
              value={filters.reporterId}
              onChange={(e) => handleFilterChange('reporterId', e.target.value)}
              placeholder="신고자 ID 입력"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div>
            <label>신고 대상 ID:</label>
            <input
              type="text"
              value={filters.reportedId}
              onChange={(e) => handleFilterChange('reportedId', e.target.value)}
              placeholder="신고 대상 ID 입력"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div>
            <label>카테고리:</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="">선택</option>
              {categoryList.map((category) => (
                <option key={category.rep_cate_idx} value={category.rep_cate_idx}>
                  {category.rep_cate_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>신고 유형:</label>
            <input
              type="text"
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              placeholder="신고 유형 입력"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div>
            <label>정렬 순서:</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="desc">최신순</option>
              <option value="asc">오래된순</option>
            </select>
          </div>
        </div>
        <button
          onClick={resetFilters}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          필터 초기화
        </button>
      </div>

      {/* 테이블 */}
      <table className="report-table">
        <thead>
          <tr>
            <th>신고 번호</th>
            <th>신고자</th>
            <th>신고 대상</th>
            <th>카테고리</th>
            <th>신고 유형</th>
            <th>신고 날짜</th>
            <th>처리 날짜</th>
            <th>처리 관리자</th>
          </tr>
        </thead>
        <tbody>
          {renderHistoryList()}
          {renderPagination()}
        </tbody>
      </table>
    </div>
  );
}