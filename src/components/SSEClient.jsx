"use client";

import { useEffect, useState } from "react";

export default function SSEClient() {
  const [eventSource, setEventSource] = useState(null);

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    // 기존 연결이 있으면 닫기
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }

    if (id && token) {
      console.log("SSE 연결 시도:", id);

      // URL 수정: 포트 번호 추가 및 중복 슬래시 제거
      const newEventSource = new EventSource(`http://localhost:80/noti/subscribe/${id}?token=${token}`);

      newEventSource.onopen = (event) => {
        console.log("SSE 연결 성공:", event);
      };

      newEventSource.onmessage = (event) => {
        console.log("실시간 알림 수신:", event.data);
        // 여기에 알림 처리 로직 추가
      };

      newEventSource.onerror = (event) => {
        console.error("SSE 오류:", event);
        newEventSource.close();
        setEventSource(null);
      };

      setEventSource(newEventSource);

      return () => {
        newEventSource.close();
        setEventSource(null);
      };
    }
  }, []); // 의존성 배열을 비워두고 수동으로 연결 관리

  // 로그인 상태 변경을 감지하는 함수
  const connectSSE = () => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (id && token && !eventSource) {
      console.log("수동 SSE 연결 시도:", id);

      const newEventSource = new EventSource(`http://localhost:80/noti/subscribe/${id}?token=${token}`);

      newEventSource.onopen = (event) => {
        console.log("SSE 연결 성공:", event);
      };

      newEventSource.onmessage = (event) => {
        console.log("실시간 알림 수신:", event.data);
      };

      newEventSource.onerror = (event) => {
        console.error("SSE 오류:", event);
        newEventSource.close();
        setEventSource(null);
      };

      setEventSource(newEventSource);
    }
  };

  // 전역에서 호출할 수 있도록 window 객체에 함수 등록
  useEffect(() => {
    window.connectSSE = connectSSE;
    return () => {
      delete window.connectSSE;
    };
  }, [eventSource]);

  return null;
}
