"use client";

import React from 'react'
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import "./report-detail.css";
import Link from "next/link";

export default function ReportDetail() {
  const searchParams = useSearchParams();
  const [reason, setReason] = useState('');
  const [reportDetail, setReportDetail] = useState(null);


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
      setReportDetail(res.data.result[0]);
    } catch (error) {
      console.log("신고 상세정보 불러오기 실패 : ", error);
    }
  };

  // 신고 처리하기
  const reportProcess = async () => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const rep_idx = searchParams.get("rep_idx");

    if (!reason.trim()) {
      alert("신고 처리 사유를 입력해주세요.");
      return;
    }

    try {
      const res = await axios.post(`http://localhost/admin/report/list/view/process`,
        {
          id: id,
          rep_idx: rep_idx,
          rep_item_idx: reportDetail.rep_item_idx,
          rep_item_type: reportDetail.rep_item_type,
          rep_reason: reason
        },
        { headers: { Authorization: token } }
      );
      console.log("신고 처리 결과 : ", res.data);

      if (res.data.loginYN) {
        alert("신고 처리가 완료되었습니다.");
        // 처리 완료 후 목록 페이지로 이동
        window.location.href = '/admin/admin-report';
      } else {
        alert("신고 처리에 실패했습니다.");
      }
    } catch (error) {
      console.log("신고 처리 실패 : ", error);
      alert("신고 처리 중 오류가 발생했습니다.");
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
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>신고 대상자 ID : {reportDetail.reported_id}</p><br />
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>신고 카테고리 : {reportDetail.cate_name}</p><br />
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>신고일 : {formatDate(reportDetail.report_at)}</p><br />
            <button className='report-process-button' onClick={reportProcess}>처리하기</button>
          </>
        ) : (
          <p>로딩 중</p>
        )}
      </div>


      {/* 신고 히스토리 내용 */}
      <div className="report-history-box">
        <h3>신고 내용</h3>
        <div className="content-box">
          {reportDetail ? (
            <div>
              <p>{reportDetail.reported_content}</p>

            </div>
          ) : (
            <p>로딩 중</p>
          )}
        </div>

        {/* 신고 처리 사유 */}
        <div className="report-process-box">
          <h3>신고 처리 사유</h3>
          <div className="content-box">
            <textarea rows={10} cols={60} name="rep_reason" id="rep_reason"
              value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}