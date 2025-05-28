"use client";
import axios from "axios";
import "../admin_report.css";
import { headers } from "next/headers";

export default function AdminReportCategory() {

  useEffect(() => {
    // 세션 스토리지에서 사용자 정보 가져오기
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (id) {
      getReportCategory(id, token);
    } else {
      alert("관리자 로그인이 필요합니다.");
      window.location.href = "/login";
    }
  }, []);

  const getReportCategory = async (id, token) => {
    try {
      const res = await axios.get(`http://localhost/admin/report-manage/report-cate-list`, {
        headers: {
          Authorization: token
        }
      });
    } catch (error) {
      console.log(error);
    }
  }


  return (
    <div>page</div>
  );
}