"use client";
import axios from "axios";
import "../admin_report.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminReportCategory() {
  const router = useRouter();
  // 신고 카테고리 목록 상태
  const [reportCategory, setReportCategory] = useState([]);
  // 새 카테고리 이름 입력 상태
  const [newCategoryName, setNewCategoryName] = useState("");

  // 컴포넌트 마운트 시 카테고리 목록 불러오기
  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    if (id) {
      getReportCategory(id, token);
    } else {
      alert("관리자 로그인이 필요합니다.");
      router.push("/login");
    }
  }, [router]); // router를 의존성 배열에 추가

  // 신고 카테고리 목록 불러오기
  const getReportCategory = async (id, token) => {
    try {
      const res = await axios.get(`http://localhost/admin/report-manage/report-cate-list`, {
        params: { id },
        headers: { Authorization: token }
      });
      console.log(res.data.result);
      setReportCategory(res.data.result); // state 에 저장
    } catch (error) {
      alert("신고 카테고리 목록 가져오기 실패");
    }
  };

  // 새 카테고리 추가 핸들러
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("카테고리 이름을 입력하세요.");
      return;
    }
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    if (!id || !token) {
      alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
      router.push("/login");
      return;
    }
    try {
      await axios.post(`http://localhost/admin/report-manage/add-cate`, {
        id,
        cate_name: newCategoryName,
        // cate_active_yn 제거 (백엔드에서 기본값 처리)
      }, {
        headers: { Authorization: token }
      });
      setNewCategoryName(""); // 입력창 초기화
      getReportCategory(id, token); // 추가 후 목록 새로고침
      alert("새 카테고리가 추가되었습니다.");
    } catch (error) {
      console.error("카테고리 추가 에러:", error); // 콘솔에 에러 로그 출력
      alert("카테고리 추가 실패");
    }
  };


  return (
    <div className="inbox-container">
      {/* 상단 헤더: 제목 + 새 카테고리 입력/추가 + 이전 페이지 버튼 */}
      <div className="inbox-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* 제목 + 새 카테고리 입력/추가 UI */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1>신고 카테고리 관리</h1>
          {/* 새 카테고리 이름 입력 */}
          <input
            type="text"
            placeholder="새 카테고리 이름"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          {/* 새 카테고리 추가 버튼 */}
          <button onClick={handleAddCategory} className="report-cate-update">저장</button>
        </div>
        {/* 이전 페이지로 이동 버튼 */}
        <Link href="/admin/admin-report">
          <button className="report-cate-back">이전 페이지로</button>
        </Link>
      </div>

      {/* 신고 카테고리 목록 테이블 */}
      <table className="report-table">
        <thead>
          <tr>
            <th>카테고리 번호</th>
            <th>카테고리 이름</th>
            <th>카테고리 활성</th>
          </tr>
        </thead>
        <tbody>
          {reportCategory.length === 0 ? (
            // 카테고리 없을 때 안내 문구
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                신고 카테고리가 없습니다.
              </td>
            </tr>
          ) : (
            // 카테고리 목록 렌더링
            reportCategory.map((cate) => (
              <tr key={cate.rep_cate_idx}>
                <td>{cate.rep_cate_idx}</td>
                <td>{cate.cate_name}</td>
                <td>{cate.cate_active_yn === "Y" ? "활성" : "비활성"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}