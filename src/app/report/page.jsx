"use client";
import { useEffect, useState } from "react";
import "./report.css";
import axios from "axios";
import { useSearchParams } from "next/navigation";

export default function UserReport() {

  const [reportCategory, setReportCategory] = useState([]);
  const [selectedCateIdx, setSelectedCateIdx] = useState(null);
  const searchParams = useSearchParams();
  const itemIdx = searchParams.get("item_idx");
  const itemType = searchParams.get("item_type");

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
    console.log("itemIdx : ", itemIdx);
    console.log("itemType : ", itemType);
    if (id && token) {
      getReportCategory(id, token);
    }
  }, []);

  // 신고 카테고리 목록 불러오기
  const getReportCategory = async (id, token) => {
    try {
      const res = await axios.get(`http://localhost/admin/report-manage/report-cate-list`, {
        params: { id },
        headers: { Authorization: token }
      });
      console.log("카테고리 목록:", res.data.result);
      setReportCategory(res.data.result);
    } catch (error) {
      console.error("카테고리 목록 로딩 실패:", error);
      alert("신고 카테고리 목록 가져오기 실패");
    }
  };

  // 신고 카테고리 목록 렌더링
  const renderReportCategory = () => {
    return reportCategory.map((report) => {
      return (
        <li key={report.rep_cate_idx} className="report-category-item">
          <label>
            <input style={{ marginRight: "10px" }}
              type="radio"
              name="report-category"
              checked={selectedCateIdx === report.rep_cate_idx}
              onChange={() => setSelectedCateIdx(report.rep_cate_idx)}
            />
            <span>{report.cate_name}</span>
          </label>
        </li>
      );
    });
  };

  // 신고하기
  const handleReport = async (selectedCateIdx, itemIdx, itemType) => {
    if (!selectedCateIdx) {
      alert("신고 카테고리를 선택해주세요.");
      return;
    }
    const id = sessionStorage.getItem('id');
    const token = sessionStorage.getItem('token');

    const response = await fetch(`http://localhost/report`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reporter_id: id,
        rep_cate_idx: selectedCateIdx,
        rep_item_idx: itemIdx,
        rep_item_type: itemType,
      })
    });

    const result = await response.json();
    alert(result.msg);
    if (result.success) {
      window.close();
    }
  };


  return (
    <div className="report-container">
      <div className="report-content">
        <h1>신고하기</h1>
        {/* 여기에 신고 폼이나 다른 컨텐츠를 추가할 수 있습니다 */}
        <div className="report-categories">
          <div className="category-header">
            <h3>신고 카테고리를 선택해주세요</h3>
            <div className="button-group">
              <button className="report-submit-btn cancel" onClick={() => window.close()}>취소</button>
              <button className="report-submit-btn" onClick={() => handleReport(selectedCateIdx, itemIdx, itemType)}>제출</button>
            </div>
          </div>
          <ul className="category-list">
            {renderReportCategory()}
          </ul>
        </div>
      </div>
    </div>
  );
}
