"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "@/redux/notificationSlice";

export default function SSEClient() {
  const [eventSource, setEventSource] = useState(null);
  const dispatch = useDispatch();

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

        try {
          // 백엔드에서 받은 알림 데이터 파싱
          const notificationData = JSON.parse(event.data);

          // Redux store에 알림 추가
          const notification = {
            id: Date.now() + Math.random(), // 고유 ID 생성
            title: notificationData.title || "새 알림",
            message: notificationData.message || notificationData.content || "새로운 알림이 도착했습니다.",
            timestamp: new Date().toISOString(),
            isRead: false,
            link: notificationData.link || null, // 알림 클릭 시 이동할 링크
            type: notificationData.type || "general" // 알림 타입
          };

          dispatch(addNotification(notification));

          // 브라우저 알림 표시 (권한이 있는 경우)
          if (Notification.permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/logo.png"
            });
          }

        } catch (error) {
          console.error("알림 데이터 파싱 오류:", error);

          // 파싱 실패 시 기본 알림 생성
          const fallbackNotification = {
            id: Date.now() + Math.random(),
            title: "새 알림",
            message: event.data,
            timestamp: new Date().toISOString(),
            isRead: false,
            link: null,
            type: "general"
          };

          dispatch(addNotification(fallbackNotification));
        }
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

        try {
          const notificationData = JSON.parse(event.data);

          const notification = {
            id: Date.now() + Math.random(),
            title: notificationData.title || "새 알림",
            message: notificationData.message || notificationData.content || "새로운 알림이 도착했습니다.",
            timestamp: new Date().toISOString(),
            isRead: false,
            link: notificationData.link || null,
            type: notificationData.type || "general"
          };

          dispatch(addNotification(notification));

          if (Notification.permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/logo.png"
            });
          }

        } catch (error) {
          console.error("알림 데이터 파싱 오류:", error);

          const fallbackNotification = {
            id: Date.now() + Math.random(),
            title: "새 알림",
            message: event.data,
            timestamp: new Date().toISOString(),
            isRead: false,
            link: null,
            type: "general"
          };

          dispatch(addNotification(fallbackNotification));
        }
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

    // 브라우저 알림 권한 요청
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      delete window.connectSSE;
    };
  }, [eventSource]);

  return null;
}
