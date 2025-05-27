"use client";

import { useEffect } from "react";

export default function SSEClient() {

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (id && token) {
      const eventSource = new EventSource(`http://localhost//noti/subscribe/${id}?token=${token}`)

      eventSource.onmessage = (event) => {
        console.log("실시간 알림 수신 : ", event.data);
      };

      eventSource.onerror = (event) => {
        console.error("SSE 오류 : ", event);
        eventSource.close();
      };

      return () => {
        eventSource.close(); // 언마운트 시 정리
      }
    }
  }, []);

  return null;
}
