"use client";

import { useEffect, useState, useRef } from "react";
import { useNotification } from "@/contexts/NotificationContext";

export default function SSEClient() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const abortControllerRef = useRef(null);

  // Context 사용
  const { addNotification } = useNotification();

  const connectSSE = async (id, token) => {
    if (isConnecting) return;

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      console.log("=== SSE 연결 시도 ===");
      console.log("사용자 ID:", id);

      const sseUrl = `http://localhost:80/noti/subscribe/${id}`;
      console.log("SSE URL:", sseUrl);

      const response = await fetch(sseUrl, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("=== SSE 연결 성공 ===");
      setConnectionStatus('connected');
      setIsConnecting(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("SSE 스트림 종료");
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === 'connected!') {
              console.log("SSE 초기 연결 확인");
              continue;
            }

            console.log("=== 실시간 알림 수신 시작 ===");
            console.log("원본 데이터:", data);

            try {
              const notificationData = JSON.parse(data);
              console.log("파싱된 데이터:", notificationData);

              const notification = {
                noti_idx: notificationData.noti_idx || Date.now(),
                noti_type: notificationData.noti_type || "새 알림",
                content_pre: notificationData.content_pre || notificationData.message || "새로운 알림이 도착했습니다.",
                noti_date: notificationData.noti_date || new Date().toISOString(),
                noti_read_yn: false,
                relate_user_id: notificationData.relate_user_id || id,
                link: notificationData.link || null
              };

              console.log('Context에 알림 추가 시작');
              addNotification(notification);
              console.log('Context에 알림 추가 완료');
              console.log("=== 실시간 알림 수신 완료 ===");

              // 브라우저 알림
              if (Notification.permission === "granted") {
                new Notification(notification.noti_type, {
                  body: notification.content_pre,
                  icon: "/logo.png"
                });
              }

            } catch (error) {
              console.error("알림 데이터 파싱 오류:", error);

              const fallbackNotification = {
                noti_idx: Date.now(),
                noti_type: "새 알림",
                content_pre: data,
                noti_date: new Date().toISOString(),
                noti_read_yn: false,
                relate_user_id: id,
                link: null
              };

              addNotification(fallbackNotification);
            }
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("SSE 연결이 중단됨");
      } else {
        console.error("SSE 연결 오류:", error);
        setConnectionStatus('error');

        setTimeout(() => {
          console.log("SSE 재연결 시도");
          const id = sessionStorage.getItem("id");
          const token = sessionStorage.getItem("token");
          if (id && token) {
            connectSSE(id, token);
          }
        }, 5000);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    if (id && token) {
      connectSSE(id, token);
    }

    return () => {
      console.log("SSE 연결 정리");
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setConnectionStatus('disconnected');
    };
  }, []);

  useEffect(() => {
    console.log("SSE 연결 상태 변경:", connectionStatus);
  }, [connectionStatus]);

  useEffect(() => {
    window.connectSSE = () => {
      const id = sessionStorage.getItem("id");
      const token = sessionStorage.getItem("token");
      if (id && token) {
        connectSSE(id, token);
      }
    };

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      delete window.connectSSE;
    };
  }, []);

  return null;
}