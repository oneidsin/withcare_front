"use client";

import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import "./block-detail.css";

// useSearchParams를 사용하는 컴포넌트를 분리
function DetailContent() {
  const [blockDetail, setBlockDetail] = useState(null);
  const searchParams = useSearchParams();
  const [reason, setReason] = useState('');
  const blocked_id = searchParams.get("blocked_id");
  const block_idx = searchParams.get("block_idx");

  useEffect(() => {
    getBlockDetail();
  }, []);

  // 차단 상세보기
  const getBlockDetail = async () => {

    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    try {
      const res = await axios.post(`http://localhost/admin/block/detail`,
        { id: id, block_idx: block_idx, blocked_id: blocked_id },
        { headers: { Authorization: token } }
      );
      console.log("응답 : ", res.data);
      setBlockDetail(res.data.result);
    } catch (error) {
      console.log("차단 상세보기 실패 : ", error);
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

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>차단 상세보기</h1>
        <div className="action-buttons">
          <Link href="/admin/admin-block">
            <button className="back-button">뒤로가기</button>
          </Link>
        </div>
      </div>
      <div className="inbox-content">
        {blockDetail ? (
          <>
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>차단한 ID : {blockDetail.blocked_id}</p>
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>차단을 실행한 관리자 : {blockDetail.block_admin_id}</p>
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>차단 시작일 : {formatDate(blockDetail.block_start_date)}</p>
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>차단 종료일 : {formatDate(blockDetail.block_end_date)}</p>
          </>
        ) : (
          <p>로딩 중</p>
        )}
      </div>


      {/* 차단 사유 */}
      <div className="report-process-box">
        <h3>차단 처리 사유</h3>
        <div className="content-box">
          {blockDetail ? (
            <div>
              <textarea rows={10} cols={60} name="block_reason" id="block_reason" value={blockDetail.block_reason} readOnly></textarea>
            </div>
          ) : (
            <p>로딩 중</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 메인 컴포넌트 - Suspense로 래핑
export default function AdminBlockDetail() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <DetailContent />
    </Suspense>
  );
}