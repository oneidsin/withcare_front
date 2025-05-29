"use client"; // Next.js 13+ App Router 환경에서 클라이언트 컴포넌트임을 명시합니다.

import { useState, useEffect } from "react"; // React의 상태(useState) 및 생명주기/부수효과(useEffect) 훅을 가져옵니다.
import axios from "axios"; // HTTP 요청을 보내기 위한 axios 라이브러리를 가져옵니다.
import { Pagination, Stack } from '@mui/material'; // 페이지네이션 UI를 위한 Material-UI 컴포넌트를 가져옵니다.
import "../admin_report.css"; // 이 컴포넌트에 적용될 CSS 파일을 가져옵니다.
import "./admin-history.css";
import { useRouter } from "next/navigation";

// AdminReportHistory 컴포넌트를 정의하고 내보냅니다.
export default function AdminReportHistory() {
  const router = useRouter();

  // === 상태 관리 ===
  // useState 훅을 사용하여 컴포넌트의 상태 변수들을 정의합니다.

  // 신고 히스토리 목록을 저장할 상태 변수. 초기값은 빈 배열입니다.
  const [historyList, setHistoryList] = useState([]);
  // 현재 페이지 번호를 저장할 상태 변수. 초기값은 1입니다.
  const [currentPage, setCurrentPage] = useState(1);
  // 전체 페이지 수를 저장할 상태 변수. 초기값은 1입니다.
  const [totalPages, setTotalPages] = useState(1);
  // 카테고리 목록(필터 드롭다운용)을 저장할 상태 변수. 초기값은 빈 배열입니다.
  const [categoryList, setCategoryList] = useState([]);
  // 검색 필터 값들을 저장할 상태 변수. 객체 형태로 관리합니다.
  const [filters, setFilters] = useState({
    reporterId: '', // 신고자 ID 필터
    reportedId: '', // 신고 대상 ID 필터
    category: '',     // 카테고리 ID 필터
    reportType: '',   // 신고 유형 필터
    sortOrder: 'desc' // 정렬 순서 필터 (기본값: 최신순)
  });
  // 한 페이지에 보여줄 항목의 수. 상수로 정의합니다.
  const pageSize = 10;

  // === 부수 효과 관리 ===
  // useEffect 훅을 사용하여 컴포넌트 렌더링 후 특정 작업을 수행합니다.
  // [currentPage, filters] 배열은 의존성 배열로, 이 값들이 변경될 때마다 useEffect 안의 함수가 실행됩니다.
  useEffect(() => {
    // 세션 스토리지에서 관리자 ID와 토큰을 가져옵니다.
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    // 관리자 ID가 있는지 확인합니다.
    if (id) {
      // ID가 있으면, 현재 페이지와 필터에 맞는 신고 히스토리 목록을 가져옵니다.
      getReportHistory(currentPage, id, token);
      // 카테고리 목록이 아직 로드되지 않았다면 가져옵니다 (드롭다운 채우기용).
      if (categoryList.length === 0) {
        getCategoryList(id, token);
      }
    } else {
      // ID가 없으면 (로그인되지 않았으면), 경고창을 띄우고 로그인 페이지로 이동합니다.
      alert("관리자 로그인이 필요합니다.");
      window.location.href = '/login';
    }
  }, [currentPage, filters]); // currentPage 또는 filters 상태가 변경될 때마다 이 useEffect를 다시 실행합니다.

  // === API 호출 함수 ===

  /**
   * 백엔드에서 신고 카테고리 목록을 가져오는 비동기 함수입니다.
   * 필터 드롭다운을 채우는 데 사용됩니다.
   * @param {string} id - 관리자 ID
   * @param {string} token - 인증 토큰
   */
  const getCategoryList = async (id, token) => {
    try {
      // axios를 사용하여 GET 요청을 보냅니다.
      const res = await axios.get(`http://localhost/admin/report-manage/report-cate-list`, {
        params: { id }, // 요청 파라미터로 id를 전달합니다.
        headers: { Authorization: token } // 요청 헤더에 인증 토큰을 포함합니다.
      });

      // 요청이 성공하고 결과 데이터가 있으면
      if (res.data.result) {
        // categoryList 상태를 업데이트합니다.
        setCategoryList(res.data.result);
        console.log('카테고리 목록:', res.data.result); // 콘솔에 로그를 남깁니다.
      }
    } catch (error) {
      // 에러 발생 시 콘솔에 에러 로그를 남깁니다.
      console.error("카테고리 목록 가져오기 실패:", error);
    }
  };

  /**
   * 백엔드에서 신고 히스토리 목록을 가져오는 비동기 함수입니다.
   * 현재 페이지와 설정된 필터 값을 기반으로 데이터를 요청합니다.
   * @param {number} page - 요청할 페이지 번호
   * @param {string} id - 관리자 ID
   * @param {string} token - 인증 토큰
   */
  const getReportHistory = async (page, id, token) => {
    try {
      // 요청에 포함할 파라미터 객체를 생성합니다.
      const params = {
        id: id,
        page: page,
        pageSize: pageSize,
        ...filters // 현재 설정된 모든 필터 값을 복사하여 포함합니다.
      };

      // 파라미터 객체에서 값이 비어있는 필드는 제거합니다.
      // (백엔드에서 불필요한 빈 값 처리를 줄이기 위함)
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      // axios를 사용하여 GET 요청을 보냅니다.
      const res = await axios.get(`http://localhost/admin/report/history`, {
        params: params, // 동적으로 생성된 파라미터를 전달합니다.
        headers: {
          Authorization: token // 요청 헤더에 인증 토큰을 포함합니다.
        }
      });

      console.log('response:', res); // 백엔드 응답을 콘솔에 출력합니다.

      // 응답에서 loginYN (로그인 여부)를 확인합니다.
      if (res.data.loginYN) {
        // 로그인 상태가 정상이면, 응답 데이터를 사용하여 상태를 업데이트합니다.
        const result = res.data.result;
        setHistoryList(result.list || []); // 신고 목록 업데이트
        setTotalPages(result.totalPage || 1); // 전체 페이지 수 업데이트
        setCurrentPage(result.page || page); // 현재 페이지 번호 업데이트
        console.log('result:', result); // 결과 데이터를 콘솔에 출력합니다.
      } else {
        // 로그인 상태가 아니면 경고창을 띄우고 로그인 페이지로 이동합니다.
        alert('관리자 로그인이 필요합니다.');
        window.location.href = '/login';
      }
    } catch (error) {
      // 에러 발생 시 콘솔에 에러 로그를 남기고 사용자에게 알립니다.
      console.error("신고 히스토리 목록 불러오기 실패:", error);
      alert("신고 히스토리 목록을 불러오는데 실패했습니다.");
    }
  };

  // === 헬퍼(Helper) 함수 ===

  /**
   * 날짜/시간 문자열을 'YYYY.MM.DD. HH:MM' 형식으로 포맷팅하는 함수입니다.
   * @param {string} dateString - 포맷팅할 날짜/시간 문자열
   * @returns {string} 포맷팅된 문자열 또는 '-'
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-'; // 입력값이 없으면 '-' 반환
    const date = new Date(dateString); // Date 객체 생성
    // 한국 시간 기준으로 날짜 부분 포맷팅 (YYYY.MM.DD.)
    const datePart = date.toLocaleDateString('ko-KR').replace(/ /g, '');
    // 한국 시간 기준으로 시간 부분 포맷팅 (HH:MM)
    const timePart = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${datePart} ${timePart}`; // 날짜와 시간 결합하여 반환
  };

  // === 이벤트 핸들러 ===

  /**
   * 신고 상세보기 페이지로 이동하는 함수입니다.
   * @param {number} rep_list_idx - 신고 리스트 번호
   */
  const handleDetailView = (rep_list_idx) => {
    // 신고 상세보기 페이지로 이동 (새 탭에서 열기)
    console.log('rep_list_idx:', rep_list_idx);
    router.push(`/admin/admin-report/history/detail?rep_list_idx=${rep_list_idx}`);
  };

  /**
   * 필터 입력 값(input, select)이 변경될 때 호출되는 핸들러입니다.
   * 변경된 필터 키와 값을 받아 filters 상태를 업데이트합니다.
   * @param {string} key - 변경된 필터의 키 (예: 'reporterId', 'category')
   * @param {string} value - 변경된 필터의 값
   */
  const handleFilterChange = (key, value) => {
    // setFilters를 사용하여 이전 상태를 기반으로 새로운 상태를 만듭니다.
    setFilters(prev => ({
      ...prev,   // 이전 필터 값들을 그대로 유지하고,
      [key]: value // 변경된 키에 해당하는 값만 업데이트합니다.
    }));
    setCurrentPage(1); // 필터가 변경되면 검색 결과가 달라지므로, 첫 페이지(1)로 이동합니다.
  };

  /**
   * '필터 초기화' 버튼 클릭 시 호출되는 핸들러입니다.
   * 모든 필터 값을 초기 상태로 되돌립니다.
   */
  const resetFilters = () => {
    setFilters({
      reporterId: '',
      reportedId: '',
      category: '',
      reportType: '',
      sortOrder: 'desc' // 정렬 순서는 기본값(최신순)으로 설정합니다.
    });
    setCurrentPage(1); // 필터 초기화 시에도 첫 페이지로 이동합니다.
  };

  /**
   * 페이지네이션 컴포넌트에서 페이지 번호를 클릭할 때 호출되는 핸들러입니다.
   * 클릭된 페이지 번호로 currentPage 상태를 업데이트합니다.
   * @param {object} event - 이벤트 객체 (Material-UI Pagination에서 제공)
   * @param {number} page - 선택된 페이지 번호
   */
  const handlePageChange = (event, page) => {
    setCurrentPage(page); // currentPage 상태를 업데이트하면, useEffect가 실행되어 해당 페이지 데이터를 다시 불러옵니다.
  };

  // === 렌더링 함수 ===

  /**
   * 신고 히스토리 목록(테이블의 tbody 내용)을 렌더링하는 함수입니다.
   * @returns {JSX.Element} 테이블 행(<tr>)들의 JSX 요소
   */
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
      <tr key={history.rep_list_idx}>
        <td>{history.rep_list_idx}</td>
        <td>{history.reporter_id}</td>
        <td>
          <span
            className="detail-link"
            onClick={() => handleDetailView(history.rep_list_idx)}
            title="상세보기"
          >
            {history.reported_id}
          </span>
        </td>
        <td>{history.cate_name || history.rep_cate_idx || '-'}</td>
        <td>{history.rep_item_type}</td>
        <td>{formatDate(history.report_at)}</td>
        <td>{formatDate(history.process_date)}</td>
        <td>{history.rep_admin_id}</td>
      </tr>
    ));
  };

  /**
   * 페이지네이션 컴포넌트를 렌더링하는 함수입니다.
   * @returns {JSX.Element | null} 페이지네이션 JSX 요소 또는 null
   */
  const renderPagination = () => {
    // historyList가 비어있으면 페이지네이션을 표시하지 않습니다.
    if (historyList.length === 0) return null;

    // Material-UI의 Pagination 컴포넌트를 사용하여 페이지네이션 UI를 렌더링합니다.
    return (
      <tr>
        <td colSpan="8"> {/* 테이블 전체 너비를 차지하도록 colSpan 설정 */}
          <Stack spacing={2} sx={{ alignItems: 'center', mt: 2, mb: 2 }}> {/* 가운데 정렬 및 여백 설정 */}
            <Pagination
              count={totalPages}    // 전체 페이지 수
              page={currentPage}    // 현재 페이지 번호
              onChange={handlePageChange} // 페이지 변경 시 호출될 핸들러
            />
          </Stack>
        </td>
      </tr>
    );
  };

  // === 컴포넌트 JSX 반환 ===
  // 이 컴포넌트가 실제로 화면에 그려낼 HTML 구조를 반환합니다.
  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>신고 히스토리</h1>
      </div>

      {/* 필터 섹션 (className 적용) */}
      <div className="filter-section">
        {/* --- 첫 번째 줄 필터 --- */}
        <div className="filter-grid">
          {/* 신고자 ID 필터 */}
          <div className="filter-item"> {/* 각 필터를 .filter-item 으로 감쌉니다. */}
            <label>신고자 ID:</label>
            <input
              type="text"
              value={filters.reporterId}
              onChange={(e) => handleFilterChange('reporterId', e.target.value)}
              placeholder="신고자 ID 입력"
            // style 속성 제거
            />
          </div>
          {/* 신고 대상 ID 필터 */}
          <div className="filter-item">
            <label>신고 대상 ID:</label>
            <input
              type="text"
              value={filters.reportedId}
              onChange={(e) => handleFilterChange('reportedId', e.target.value)}
              placeholder="신고 대상 ID 입력"
            // style 속성 제거
            />
          </div>
          {/* 카테고리 필터 */}
          <div className="filter-item">
            <label>카테고리:</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            // style 속성 제거
            >
              <option value="">선택</option>
              {categoryList.map((category) => (
                <option key={category.rep_cate_idx} value={category.rep_cate_idx}>
                  {category.cate_name}
                </option>
              ))}
            </select>
          </div>
        </div> {/* --- 첫 번째 줄 필터 끝 --- */}

        {/* --- 두 번째 줄 필터 --- */}
        <div className="filter-grid">
          {/* 신고 유형 필터 */}
          <div className="filter-item">
            <label>신고 유형:</label>
            <input
              type="text"
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              placeholder="신고 유형 입력"
            // style 속성 제거
            />
          </div>
          {/* 정렬 순서 필터 */}
          <div className="filter-item">
            <label>정렬 순서:</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            // style 속성 제거
            >
              <option value="desc">최신순</option>
              <option value="asc">오래된순</option>
            </select>
          </div>
        </div> {/* --- 두 번째 줄 필터 끝 --- */}

        {/* 필터 초기화 버튼 */}
        <button
          onClick={resetFilters}
          className="reset-button" // className 적용, style 속성 제거
        >
          필터 초기화
        </button>
      </div> {/* --- 필터 섹션 끝 --- */}

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
          {historyList.length > 0 && (
            <tr>
              <td colSpan="8">
                <div className="pagination-container">
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}