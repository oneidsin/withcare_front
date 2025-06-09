"use client";

import React from 'react'
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import "./report-detail.css";
import Link from "next/link";

export default function ReportDetail() {
  const searchParams = useSearchParams();
  const [processReason, setProcessReason] = useState(''); // 처리 사유 (관리자가 작성)
  const [reportDetail, setReportDetail] = useState(null);
  const [status, setStatus] = useState('미처리');
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const rep_idx = searchParams.get("rep_idx");

    console.log("초기화 - id:", id, "token:", token ? "있음" : "없음", "rep_idx:", rep_idx);

    // 로그인 정보 확인
    if (!id || !token) {
      console.log("로그인 정보 없음");
      setError("관리자 로그인이 필요합니다.");
      setLoading(false);
      alert("관리자 로그인이 필요합니다.");
      window.location.href = '/login';
      return;
    }

    // rep_idx 확인
    if (!rep_idx) {
      console.log("rep_idx 없음");
      setError("잘못된 접근입니다.");
      setLoading(false);
      alert("잘못된 접근입니다.");
      window.location.href = '/admin/admin-report';
      return;
    }

    getReportDetail(id, token, rep_idx);
  }, [searchParams]);

  // 신고 정보 불러오기
  const getReportDetail = async (id, token, rep_idx) => {
    try {
      setLoading(true);
      setError(null);

      console.log("API 호출 시작 - id:", id, "rep_idx:", rep_idx);

      const res = await axios.post(`http://localhost/admin/report/list/view`,
        { id: id, rep_idx: rep_idx },
        {
          headers: { Authorization: token },
          timeout: 10000 // 10초 타임아웃 설정
        }
      );

      console.log("API 응답:", res.data);

      // 응답 데이터 검증
      if (!res.data || !res.data.result || res.data.result.length === 0) {
        throw new Error("신고 정보를 찾을 수 없습니다.");
      }

      const reportData = res.data.result[0];
      setReportDetail(reportData);

      // 기존 처리 사유가 있으면 설정
      if (reportData.rep_reason) {
        setProcessReason(reportData.rep_reason);
      }

      // status가 있으면 상태도 반영
      if (reportData.status) {
        setStatus(reportData.status);
      }

      setLoading(false);
    } catch (error) {
      console.error("신고 상세정보 불러오기 실패:", error);

      let errorMessage = "신고 정보를 불러오는데 실패했습니다.";

      if (error.response) {
        // 서버 응답이 있는 경우
        if (error.response.status === 401) {
          errorMessage = "로그인 세션이 만료되었습니다. 다시 로그인해주세요.";
          sessionStorage.clear();
          window.location.href = '/login';
          return;
        } else if (error.response.status === 403) {
          errorMessage = "접근 권한이 없습니다.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "서버 응답 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setLoading(false);
      alert(errorMessage);
    }
  };

  // 신고 처리하기
  const reportProcess = async () => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const rep_idx = searchParams.get("rep_idx");

    console.log("처리 시작 - 데이터 확인:");
    console.log("id:", id);
    console.log("token:", token);
    console.log("rep_idx:", rep_idx);
    console.log("processReason:", processReason);
    console.log("status:", status);
    console.log("reportDetail:", reportDetail);

    if (!processReason.trim()) {
      alert("신고 처리 사유를 입력해주세요.");
      return;
    }

    if (!reportDetail) {
      alert("신고 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const requestData = {
      id: id,
      rep_idx: rep_idx,
      rep_item_idx: reportDetail.rep_item_idx,
      rep_item_type: reportDetail.rep_item_type,
      rep_reason: processReason,
      status: status,  // 백엔드에서 status 키로 받음
      rep_yn: status   // 히스토리 테이블용
    };

    console.log("서버로 전송할 데이터:", requestData);

    try {
      const res = await axios.post(`http://localhost/admin/report/list/view/process`,
        requestData,
        { headers: { Authorization: token } }
      );
      console.log("신고 처리 결과 : ", res.data);

      if (res.data.loginYN) {
        alert("신고 처리가 완료되었습니다.");
        // 처리 완료 후 목록 페이지로 이동
        window.location.href = '/admin/admin-report';
      } else {
        alert("신고 처리에 실패했습니다. 응답: " + JSON.stringify(res.data));
      }
    } catch (error) {
      console.log("신고 처리 실패 : ", error);
      console.log("에러 상세:", error.response?.data);
      alert("신고 처리 중 오류가 발생했습니다: " + (error.response?.data?.message || error.message));
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

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>신고 처리 페이지</h1>
        <div className="action-buttons">
          <Link href="/admin/admin-report">
            <button className="back-button">뒤로가기</button>
          </Link>
        </div>
      </div>
      <div className="inbox-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>신고 정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
            <p>오류: {error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>
              다시 시도
            </button>
          </div>
        ) : reportDetail ? (
          <>
            <div className="report-info-container">
              <div className="report-info-left">
                <p className="report-info-item">신고 대상자 ID : {reportDetail.reported_id}</p>
                <p className="report-info-item">신고 카테고리 : {reportDetail.cate_name}</p>
                <p className="report-info-item">신고일 : {formatDate(reportDetail.report_at)}</p>
              </div>
              <div className="report-info-right">
                <select
                  className="status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="미처리">미처리</option>
                  <option value="처리중">처리중</option>
                  <option value="처리 완료">처리 완료</option>
                </select>
                <button className='report-process-button' onClick={reportProcess}>처리하기</button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>신고 정보가 없습니다.</p>
          </div>
        )}
      </div>


      {/* 신고 상세 내용 */}
      {!loading && !error && (
        <div className="report-history-box">
          <h3>신고 내용</h3>
          <div className="content-box">
            {reportDetail ? (
              <div>
                <p><strong>신고된 내용:</strong> {reportDetail.reported_content}</p>
              </div>
            ) : (
              <p>신고 내용이 없습니다.</p>
            )}
          </div>

          {/* 신고 처리 사유 */}
          <div className="report-process-box">
            <h3>신고 처리 사유 (관리자 작성)</h3>
            <div className="content-box">
              <textarea rows={10} cols={60} name="rep_reason" id="rep_reason"
                value={processReason}
                placeholder={processReason ? '기존 처리 사유를 수정할 수 있습니다' : '처리 사유를 입력하세요'}
                onChange={(e) => setProcessReason(e.target.value)}></textarea>
              {processReason && (
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  * 기존 처리 사유가 있습니다. 수정 후 처리하기 버튼을 클릭하세요.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}