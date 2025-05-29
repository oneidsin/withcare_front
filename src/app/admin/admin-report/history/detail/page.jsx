"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import "../../admin_report.css";
import "./history-detail.css";
import Link from "next/link";

export default function AdminReportHistoryDetail() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const rep_list_idx = searchParams.get("rep_list_idx");

    if (!id) {
      alert("관리자 로그인이 필요합니다.");
      window.location.href = '/login';
      return;
    }

    if (!rep_list_idx) {
      alert("유효하지 않은 접근입니다.");
      window.location.href = '/admin/admin-report/history';
      return;
    }

    getReportHistoryDetail(id, token, rep_list_idx);
  }, [searchParams]);

  // 신고 히스토리 상세보기 불러오기
  const getReportHistoryDetail = async (id, token, rep_list_idx) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost/admin/report/history/detail`, {
        params: { id: id, rep_list_idx: rep_list_idx },
        headers: { Authorization: token }
      });

      if (res.data.loginYN) {
        setReportDetail(res.data.result);
      } else {
        alert("관리자 로그인이 필요합니다.");
        window.location.href = '/login';
      }
    } catch (error) {
      console.log("신고 히스토리 상세정보 불러오기 실패 : ", error);
      alert("신고 히스토리 상세정보 불러오기 실패");
    } finally {
      setLoading(false);
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
        <h1>신고 히스토리 상세보기</h1>
        <div className="action-buttons">
          <Link href="/admin/admin-report/history">
            <button className="back-button">뒤로가기</button>
          </Link>
        </div>
      </div>
    </div>
  );
}