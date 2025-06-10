"use client";

import React from 'react'
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import "./report-detail.css";
import Link from "next/link";

// useSearchParams를 사용하는 컴포넌트를 분리
function DetailContent() {
  const searchParams = useSearchParams();
  const [processReason, setProcessReason] = useState(''); // 처리 사유 (관리자가 작성)
  const [reportDetail, setReportDetail] = useState(null);
  const [status, setStatus] = useState('미처리');


  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const rep_idx = searchParams.get("rep_idx");
    console.log("rep_idx : ", rep_idx);

    if (id) {
      getReportDetail(id, token, rep_idx);
    } else {
      alert("관리자 로그인이 필요합니다.");
      window.location.href = '/login';
      return;
    }
  }, [searchParams]);

  // 신고 정보 불러오기
  const getReportDetail = async (id, token, rep_idx) => {
    try {
      const res = await axios.post(`http://localhost/admin/report/list/view`,
        { id: id, rep_idx: rep_idx },
        { headers: { Authorization: token } }
      );
      console.log("res : ", res.data);
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
    } catch (error) {
      console.log("신고 상세정보 불러오기 실패 : ", error);
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
        {reportDetail ? (
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
          <p>로딩 중</p>
        )}
      </div>


      {/* 신고 상세 내용 */}
      <div className="report-history-box">
        <h3>신고 내용</h3>
        <div className="content-box">
          {reportDetail ? (
            <div>
              <p><strong>신고된 내용:</strong> {reportDetail.reported_content}</p>
            </div>
          ) : (
            <p>로딩 중</p>
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
    </div>
  );
}

// 메인 컴포넌트 - Suspense로 래핑
export default function ReportDetail() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <DetailContent />
    </Suspense>
  );
}