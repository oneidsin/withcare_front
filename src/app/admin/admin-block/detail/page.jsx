"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminBlockDetail() {
  const [blockDetail, setBlockDetail] = useState([]);
  const searchParams = useSearchParams();
  const blocked_id = searchParams.get("blocked_id");

  useEffect(() => {
    getBlockDetail();
  }, []);

  // 차단 상세보기
  const getBlockDetail = async () => {

    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    try {
      const res = await axios.post(`http://localhost/admin/block/detail`,
        { id: id, blocked_id: blocked_id },
        { headers: { Authorization: token } }
      );
      console.log("응답 : ", res.data);
      setBlockDetail(res.data.result[0]);
    } catch (error) {
      console.log("차단 상세보기 실패 : ", error);
    }
  };

  // 차단 렌더링
  const renderBlockDetail = () => {
    return blockDetail.map((block) => (
      <tr key={block.block_idx}>
        <td>{block.block_idx}</td>
        <td>{block.blocked_id}</td>
        <td>{block.block_admin_id}</td>
        <td>{block.block_reason}</td>
        <td>{formatDate(block.block_start_date)}</td>
        <td>{formatDate(block.block_end_date)}</td>
      </tr>
    ));
  };

  // 날짜를 한국 형식으로 포맷팅하는 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-'; // 날짜 문자열이 없으면 '-' 반환

    const date = new Date(dateString); // 날짜 객체 생성
    // 날짜 부분만 한국어 형식으로 변환하고 공백 제거
    const datePart = date.toLocaleDateString('ko-KR').replace(/ /g, '');

    return datePart; // 날짜만 반환
  };

  return (
    <div>page</div>
  );
}