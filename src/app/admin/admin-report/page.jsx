"use client"; // Next.js에서 클라이언트 컴포넌트 선언

// 필요한 라이브러리 및 컴포넌트 import
import { useState, useEffect } from "react"; // React hooks
import axios from "axios"; // HTTP 요청을 위한 라이브러리
import { Pagination, Stack } from '@mui/material'; // Material UI 페이지네이션 컴포넌트
import "./admin_report.css"; // 스타일시트 import
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminReport() {
  const router = useRouter();
  // 상태 관리 (React hooks)
  const [reportList, setReportList] = useState([]); // 신고 목록 데이터를 저장하는 상태
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호를 저장하는 상태
  const [totalPages, setTotalPages] = useState(1); // 전체 페이지 수를 저장하는 상태
  const pageSize = 10; // 한 페이지에 표시할 항목 수 설정

  // 컴포넌트가 마운트되거나 id, currentPage가 변경될 때 실행되는 효과
  useEffect(() => {
    // 세션스토리지에서 사용자 정보 가져오기
    const id = sessionStorage.getItem("id"); // 세션에 저장된 사용자 ID
    const token = sessionStorage.getItem("token"); // 세션에 저장된 인증 토큰

    if (id) { // 사용자 ID가 있는 경우에만 실행
      getReportList(currentPage, id, token); // 신고 목록 가져오기 함수 호출
    } else {
      alert('관리자 로그인이 필요합니다.');
      window.location.href = '/login';
    }
  }, [currentPage]); // 의존성 배열: currentPage가 변경될 때마다 실행

  // 신고 목록을 가져오는 비동기 함수
  const getReportList = async (page, id, token) => {
    try {
      // 백엔드 API 호출
      const response = await axios.get(`http://localhost/admin/report/list`, {
        params: { // 쿼리 파라미터 설정
          id: id, // 사용자 ID
          page: page, // 페이지 번호
          pageSize: pageSize // 페이지 크기
        },
        headers: { // 요청 헤더 설정
          Authorization: token // 인증 토큰
        }
      });

      console.log('response:', response);

      // 응답 데이터 처리
      if (response.data.loginYN) { // 로그인 상태가 유효한 경우
        const result = response.data.result; // 결과 데이터 추출
        setReportList(result.list || []); // 신고 목록 상태 업데이트 (list 필드 사용)
        setTotalPages(result.totalPage || 1); // 전체 페이지 수 상태 업데이트 (totalPage 필드 사용)
        setCurrentPage(result.page || page); // 현재 페이지 상태 업데이트 (서버에서 반환한 page 사용)
        console.log('result:', result);
      } else { // 로그인 상태가 유효하지 않은 경우
        alert('관리자 로그인이 필요합니다.'); // 경고 메시지 표시
        window.location.href = '/login'; // 로그인 페이지로 튕김
      }
    } catch (error) { // 에러 처리
      console.error('신고 목록 가져오기 실패:', error); // 콘솔에 에러 로깅
      alert('신고 목록을 불러오는데 실패했습니다.'); // 사용자에게 에러 메시지 표시
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
    getReportList(page, id, token); // 선택된 페이지의 신고 목록 가져오기
  };

  // 리포트 목록 렌더링 함수
  const renderReportList = () => {
    if (reportList.length === 0) {
      return (
        <tr>
          <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
            신고 내역이 없습니다.
          </td>
        </tr>
      );
    }

    const handleDetailView = (rep_idx) => {
      // 신고 상세보기 페이지로 이동 (새 탭에서 열기)
      console.log('rep_idx:', rep_idx);
      router.push(`/admin/admin-report/detail?rep_idx=${rep_idx}`);
    };

    return reportList.map((report) => (
      <tr
        key={report.rep_idx}
        className={report.status === '처리 완료' ? 'processed' : 'unprocessed'}
      >
        <td>{report.rep_idx}</td>
        <td>{report.reporter_id}</td>
        <td>{report.cate_name}</td>
        <td>
          <span className="detail-link"
            onClick={() => handleDetailView(report.rep_idx)}
            title="상세보기"
          >
            {report.reported_id}
          </span>
        </td>
        <td>{formatDate(report.report_at)}</td>
        <td>{report.status}</td>
      </tr>
    ));
  };

  // 페이지네이션 렌더링 함수
  const renderPagination = () => {
    if (reportList.length === 0) return null;

    return (
      <tr>
        <td colSpan="6">
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

  // 컴포넌트 렌더링
  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>신고 관리</h1>
        <div>
          <Link href="/admin/admin-report/history">
            <button className="report-history-btn">신고 히스토리 페이지</button>
          </Link>
          <Link href="/admin/admin-report/category">
            <button className="report-cate-update">신고 카테고리 수정</button>
          </Link>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>신고자</th>
            <th>신고 유형</th>
            <th>대상 유저</th>
            <th>신고 날짜</th>
            <th>처리 상태</th>
          </tr>
        </thead>
        <tbody>
          {renderReportList()}
          {renderPagination()}
        </tbody>
      </table>
    </div>
  );
}