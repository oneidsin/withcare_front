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
  // 수정 모드 상태 (수정할 카테고리의 idx 저장)
  const [editingCategoryIdx, setEditingCategoryIdx] = useState(null);

  // 컴포넌트 마운트 시 카테고리 목록 불러오기
  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    if (id && token) {
      getReportCategory(id, token);
    } else {
      alert("관리자 로그인이 필요합니다.");
      router.push("/login");
    }
  }, [router]);

  // 신고 카테고리 목록 불러오기
  const getReportCategory = async (id, token) => {
    try {
      const res = await axios.get(`http://localhost/admin/report-manage/report-cate-list`, {
        params: { id },
        headers: { Authorization: token }
      });
      console.log("카테고리 목록:", res.data.result);
      setReportCategory(res.data.result || []);
    } catch (error) {
      console.error("카테고리 목록 로딩 실패:", error);
      alert("신고 카테고리 목록 가져오기 실패");
    }
  };

  // 카테고리 수정 버튼 클릭 핸들러
  const handleEditClick = (category) => {
    setNewCategoryName(category.cate_name);
    setEditingCategoryIdx(category.rep_cate_idx);
  };

  // 수정 취소 핸들러
  const handleCancelEdit = () => {
    setNewCategoryName("");
    setEditingCategoryIdx(null);
  };

  // 새 카테고리 추가 또는 수정 핸들러
  const handleAddOrUpdateCategory = async () => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (!id || !token) {
      alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
      router.push("/login");
      return;
    }

    if (newCategoryName === "") {
      alert("카테고리 이름을 입력하세요.");
      return;
    }

    try {
      let res;

      if (editingCategoryIdx) {
        // 수정 모드
        res = await axios.put(`http://localhost/admin/report-manage/report-cate-update`,
          {
            id: id,
            rep_cate_idx: editingCategoryIdx,
            cate_name: newCategoryName,
          },
          {
            headers: { Authorization: token }
          });
      } else {
        // 추가 모드
        res = await axios.post(`http://localhost/admin/report-manage/report-cate-add`,
          {
            id: id,
            cate_name: newCategoryName,
          },
          {
            headers: { Authorization: token }
          });
      }

      console.log("카테고리 처리 응답:", res.data);

      if (res.data && (res.data.success === true || res.data.loginYN === true)) {
        setNewCategoryName("");
        setEditingCategoryIdx(null);
        getReportCategory(id, token);
        alert(editingCategoryIdx ? "카테고리가 수정되었습니다." : "새 카테고리가 추가되었습니다.");
      } else {
        alert(res.data.msg || (editingCategoryIdx ? "카테고리 수정에 실패했습니다." : "카테고리 추가에 실패했습니다."));
      }

    } catch (error) {
      console.error("카테고리 처리 에러:", error);
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        alert(errorData.msg || (editingCategoryIdx ? "카테고리 수정 실패" : "카테고리 추가 실패"));
        if (errorData.loginYN === false) {
          router.push("/login");
        }
      } else {
        alert("서버 통신 오류.");
      }
    }
  };

  // 카테고리 활성 여부 변경
  const handleStatusChange = async (cateIdxToUpdate, newStatus) => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (!id || !token) {
      alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
      router.push("/login");
      return;
    }

    console.log("상태 변경 요청:", { cateIdxToUpdate, newStatus });

    const res = await axios.put(`http://localhost/admin/report-manage/report-cate-active`,
      {
        id: id,
        rep_cate_idx: cateIdxToUpdate,
        cate_active_yn: newStatus === "true" ? true : false
      },
      { headers: { Authorization: token } });

    console.log("상태 변경 응답:", res.data);

    if (res.data && (res.data.success === true || res.data.loginYN === true)) {
      // 성공 시 로컬 상태 업데이트
      setReportCategory(prevCategories =>
        prevCategories.map(cate =>
          cate.rep_cate_idx === cateIdxToUpdate
            ? { ...cate, cate_active_yn: newStatus === "true" ? true : false }
            : cate
        )
      );
      alert("카테고리 상태가 변경되었습니다.");
    } else {
      alert("카테고리 상태 변경에 실패했습니다.");
    }
  };

  return (
    <div className="inbox-container">
      {/* 상단 헤더 */}
      <div className="inbox-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1>신고 카테고리 관리</h1>
          <input
            className="report-cate-input"
            type="text"
            placeholder={editingCategoryIdx ? "카테고리 이름 수정" : "새 카테고리 이름"}
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
          />
          {/* 추가/수정 버튼 */}
          <button onClick={handleAddOrUpdateCategory} className="report-cate-update">
            {editingCategoryIdx ? "수정" : "추가"}
          </button>
          {/* 수정 모드일 때 취소 버튼 표시 */}
          {editingCategoryIdx && (
            <button onClick={handleCancelEdit} className="report-cate-cancel">
              취소
            </button>
          )}
        </div>
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
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {(reportCategory || []).length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                신고 카테고리가 없습니다.
              </td>
            </tr>
          ) : (
            (reportCategory || []).map((cate) => (
              <tr key={cate.rep_cate_idx}>
                <td>{cate.rep_cate_idx}</td>
                <td>{cate.cate_name}</td>
                <td>
                  {/* 활성/비활성 드롭다운 메뉴 */}
                  <select
                    value={cate.cate_active_yn ? "true" : "false"}
                    onChange={(e) => handleStatusChange(cate.rep_cate_idx, e.target.value)}
                    className="report-cate-status-select"
                  >
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => handleEditClick(cate)}
                    className="report-cate-edit-btn"
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}