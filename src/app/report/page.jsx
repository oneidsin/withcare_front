"use client";
import { useEffect, useState } from "react";
import "./report.css";
import axios from "axios";

export default function UserReport() {

  const [reportCategory, setReportCategory] = useState([]);

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");
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

  const renderReportCategory = () => {
    return reportCategory.map((report) => {
      return (
        <li key={report.rep_cate_idx} className="report-category-item">
          <label>
            <input type="checkbox" value={report.rep_cate_idx} />
            <span>{report.cate_name}</span>
          </label>
        </li>
      );
    });
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
              <button className="report-submit-btn cancel">취소</button>
              <button className="report-submit-btn">제출</button>
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
