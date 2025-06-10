"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import "./block-process.css";
import Link from "next/link";
import axios from "axios";

// useSearchParams를 사용하는 컴포넌트를 분리
function ProcessContent() {
  const [reason, setReason] = useState('');
  const [blockedId, setBlockedId] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = sessionStorage.getItem('id');
    const token = sessionStorage.getItem('token');
    const blocked_id = searchParams.get('blocked_id');
    console.log("blocked_id : ", blocked_id);
    setBlockedId(blocked_id || '');
  }, [searchParams]);

  // 차단 처리하기
  const blockProcess = async () => {
    const id = sessionStorage.getItem('id');
    const token = sessionStorage.getItem('token');
    const blocked_id = searchParams.get('blocked_id');

    if (!reason.trim()) {
      alert('차단 처리 사유를 입력해주세요.');
      return;
    }

    const block_end_date = document.getElementById('block_end_date').value;
    console.log("block_end_date : ", block_end_date);

    try {
      const res = await axios.post(`http://localhost/admin/block/process`,
        {
          id: id,
          blocked_id: blocked_id,
          blocked_admin_id: id,
          block_reason: reason,
          block_end_date: block_end_date
        },
        { headers: { Authorization: token } }
      );

      console.log("차단 처리 결과 : ", res.data);

      if (res.data.loginYN) {
        alert('차단 처리가 완료되었습니다.');
        window.location.href = '/admin/admin-member';
      } else {
        alert('차단 처리에 실패했습니다.');
      }
    } catch (error) {
      console.log("차단 처리 실패 : ", error);
      alert('차단 처리 중 오류가 발생했습니다.');
    }
  };


  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>{blockedId} 님 차단 처리</h1>
        <div className="action-buttons">
          <Link href="/admin/admin-member">
            <button className="back-button">뒤로가기</button>
          </Link>
          <button className="block-process-button" onClick={blockProcess}>차단 처리하기</button>
        </div>
      </div>
      <div className="inbox-content">

      </div>

      {/* 차단 처리 사유 */}
      <div className="report-process-box">
        <h3>차단 처리 사유</h3>
        <label for="block_end_date">차단 종료일 : </label>
        <input type="date" id="block_end_date" name="block_end_date" />
        <div className="content-box">
          <textarea rows={10} cols={60} name="block_reason" id="block_reason"
            value={reason} placeholder="사유를 입력하세요" onChange={(e) => setReason(e.target.value)}></textarea>
        </div>
      </div>
    </div>
  );
}

// 메인 컴포넌트 - Suspense로 래핑
export default function AdminBlockProcess() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ProcessContent />
    </Suspense>
  );
}