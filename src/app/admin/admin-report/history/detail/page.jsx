"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import "../../admin_report.css";
import "./history-detail.css";
import Link from "next/link";

// useSearchParams를 사용하는 컴포넌트를 분리
function DetailContent() {
  const searchParams = useSearchParams();
  const [reportDetail, setReportDetail] = useState(null);
  const [repReason, setRepReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const rep_list_idx = searchParams.get("rep_list_idx");
    console.log("rep_list_idx : ", rep_list_idx);

    if (id) {
      getReportHistoryDetail(id, token, rep_list_idx);
    } else {
      alert("관리자 로그인이 필요합니다.");
      window.location.href = '/login';
      return;
    }
  }, [searchParams]);

  // 신고 히스토리 상세보기 불러오기
  const getReportHistoryDetail = async (id, token, rep_list_idx) => {
    try {
      const res = await axios.post(`http://localhost/admin/report/history/detail`,
        { id: id, rep_list_idx: rep_list_idx },
        { headers: { Authorization: token } }
      );
      console.log("res : ", res.data);
      setReportDetail(res.data.result[0]);
      setRepReason(res.data.result[0].rep_reason || '');
    } catch (error) {
      console.log("신고 히스토리 상세정보 불러오기 실패 : ", error);
    }
  };

  // 신고 처리 사유 업데이트
  const updateReportReason = async () => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    const rep_list_idx = searchParams.get("rep_list_idx");

    try {
      const res = await axios.post(`http://localhost/admin/report/history/update`,
        {
          id: id,
          rep_list_idx: rep_list_idx,
          rep_reason: repReason
        },
        { headers: { Authorization: token } }
      );

      console.log("업데이트 응답 : ", res.data);

      if (res.data.loginYN && res.data.result) {
        alert("신고 처리 사유가 업데이트되었습니다.");
        setIsEditing(false);
        // 업데이트된 데이터 다시 불러오기
        getReportHistoryDetail(id, token, rep_list_idx);
      } else if (!res.data.loginYN) {
        alert("로그인이 필요합니다.");
        window.location.href = '/login';
      } else {
        alert("업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.log("신고 처리 사유 업데이트 실패 : ", error);
      alert("업데이트 중 오류가 발생했습니다.");
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
      <div className="inbox-content">
        {reportDetail ? (
          <>
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>신고 대상자 ID : {reportDetail.reported_id}</p><br />
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>신고 카테고리 : {reportDetail.cate_name}</p><br />
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>신고일 : {formatDate(reportDetail.report_at)}</p><br />
            <p style={{ backgroundColor: '#228B22', color: 'white', padding: '10px', borderRadius: '5px' }}>처리일 : {formatDate(reportDetail.process_date)}</p><br />
            <button>처리 완료</button>
          </>
        ) : (
          <p>로딩 중</p>
        )}
      </div>

      {/* 신고 히스토리 내용 */}
      <div className="report-history-box">
        <h3>신고 히스토리 내용</h3>
        <div className="content-box">
          {reportDetail ? (
            <div>
              <p>{reportDetail.reported_content}</p>
            </div>
          ) : (
            <p>로딩 중</p>
          )}
        </div>
      </div>

      {/* 신고 처리 사유 */}
      <div className="report-process-box">
        <h3>신고 처리 사유</h3>
        <div className="content-box">
          {reportDetail ? (
            <div>
              <p>처리 관리자 : {reportDetail.rep_admin_id || '-'}</p>
              <textarea
                rows={10}
                cols={60}
                name="rep_reason"
                id="rep_reason"
                value={repReason}
                onChange={(e) => setRepReason(e.target.value)}
                readOnly={!isEditing}
                className={`report-reason-textarea ${isEditing ? 'editing' : 'readonly'}`}
              />
              <div className="button-group">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-edit"
                  >
                    수정하기
                  </button>
                ) : (
                  <>
                    <button
                      onClick={updateReportReason}
                      className="btn btn-save"
                    >
                      저장하기
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setRepReason(reportDetail.rep_reason || '');
                      }}
                      className="btn btn-cancel"
                    >
                      취소
                    </button>
                  </>
                )}
              </div>
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
export default function AdminReportHistoryDetail() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <DetailContent />
    </Suspense>
  );
}