"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "@/redux/notificationSlice";

/**
 * SSEClient 컴포넌트
 * 
 * 이 컴포넌트는 Server-Sent Events(SSE)를 사용하여 백엔드로부터 실시간 알림을 받는 역할을 합니다.
 * SSE는 서버에서 클라이언트로 실시간 데이터를 보내는 웹 표준 기술입니다.
 * 
 * 주요 기능:
 * 1. 로그인한 사용자의 SSE 연결 생성 및 관리
 * 2. 실시간 알림 데이터 수신 및 Redux store에 저장
 * 3. 연결 끊김 시 자동 재연결
 * 4. 브라우저 알림 표시
 */
export default function SSEClient() {
  // 연결 상태를 관리하는 state (disconnected, connecting, connected, error)
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // 현재 연결 시도 중인지 확인하는 state (중복 연결 방지용)
  const [isConnecting, setIsConnecting] = useState(false);

  // fetch 요청을 중단할 수 있는 AbortController를 저장하는 ref
  // useRef를 사용하는 이유: 컴포넌트 리렌더링 시에도 값이 유지되어야 하기 때문
  const abortControllerRef = useRef(null);

  // Redux store에 액션을 dispatch하기 위한 hook
  const dispatch = useDispatch();

  /**
   * SSE 연결을 생성하고 관리하는 비동기 함수
   * 
   * @param {string} id - 사용자 ID
   * @param {string} token - 인증 토큰
   */
  const connectSSE = async (id, token) => {
    // 이미 연결 시도 중이면 중복 실행 방지
    if (isConnecting) return;

    // 연결 시도 상태로 변경
    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // 이전 연결이 있으면 중단 (기존 연결 정리)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새로운 AbortController 생성 (연결을 중단할 수 있는 컨트롤러)
      abortControllerRef.current = new AbortController();

      console.log("SSE 연결 시도:", id);
      console.log("사용할 토큰:", token);

      // 백엔드 SSE 엔드포인트 URL
      const sseUrl = `http://localhost:80/noti/subscribe/${id}`;
      console.log("SSE URL:", sseUrl);

      /**
       * fetch API를 사용하여 SSE 연결 생성
       * EventSource 대신 fetch를 사용하는 이유: 헤더에 인증 토큰을 포함해야 하기 때문
       * EventSource는 헤더 설정이 불가능함
       */
      const response = await fetch(sseUrl, {
        method: 'GET',
        headers: {
          'Authorization': token,           // 인증 토큰을 헤더에 포함
          'Accept': 'text/event-stream',   // SSE 데이터 형식 지정
          'Cache-Control': 'no-cache',     // 캐시 방지
          'Connection': 'keep-alive'       // 연결 유지
        },
        signal: abortControllerRef.current.signal  // 연결 중단을 위한 signal
      });

      // HTTP 응답이 성공적이지 않으면 에러 발생
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("SSE 연결 성공");
      setConnectionStatus('connected');
      setIsConnecting(false);

      /**
       * 스트림 데이터를 읽기 위한 Reader 생성
       * SSE는 지속적인 데이터 스트림이므로 ReadableStream을 사용
       */
      const reader = response.body.getReader();
      const decoder = new TextDecoder(); // 바이트 데이터를 문자열로 변환

      // 무한 루프로 스트림 데이터를 계속 읽음
      while (true) {
        // 스트림에서 데이터 청크(chunk) 읽기
        const { done, value } = await reader.read();

        // 스트림이 끝나면 루프 종료
        if (done) {
          console.log("SSE 스트림 종료");
          break;
        }

        // 바이트 데이터를 문자열로 변환
        const chunk = decoder.decode(value);
        // SSE 데이터는 줄바꿈으로 구분되므로 분리
        const lines = chunk.split('\n');

        // 각 줄을 처리
        for (const line of lines) {
          // SSE 데이터는 'data: ' 접두사로 시작
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // 'data: ' 제거하여 실제 데이터만 추출

            // 초기 연결 확인 메시지는 무시
            if (data === 'connected!') {
              console.log("SSE 초기 연결 확인");
              continue;
            }

            console.log("=== 실시간 알림 수신 시작 ===");
            console.log("원본 데이터:", data);
            console.log("현재 시간:", new Date().toLocaleTimeString());

            try {
              // JSON 문자열을 객체로 파싱
              const notificationData = JSON.parse(data);
              console.log("파싱된 데이터:", notificationData);

              /**
               * 백엔드에서 받은 데이터를 프론트엔드 형식에 맞게 변환
               * 백엔드와 프론트엔드의 데이터 구조를 통일
               */
              const notification = {
                noti_idx: notificationData.noti_idx || Date.now(),                    // 알림 고유 ID
                noti_type: notificationData.noti_type || "새 알림",                   // 알림 타입
                content_pre: notificationData.content_pre || notificationData.message || "새로운 알림이 도착했습니다.", // 알림 내용
                noti_date: notificationData.noti_date || new Date().toISOString(),   // 알림 생성 시간
                noti_read_yn: false,                                                 // 읽음 여부 (새 알림은 항상 false)
                relate_user_id: notificationData.relate_user_id || id,               // 알림 수신자 ID
                link: notificationData.link || null                                  // 알림 클릭 시 이동할 링크
              };

              console.log('SSE에서 생성한 알림 객체:', notification);
              console.log('Redux에 dispatch 시작');

              // Redux store에 새 알림 추가 (이때 unreadCount도 자동으로 증가)
              dispatch(addNotification(notification));

              console.log('Redux에 dispatch 완료');
              console.log("=== 실시간 알림 수신 완료 ===");

              /**
               * 브라우저 알림 표시
               * 사용자가 브라우저 알림 권한을 허용한 경우에만 표시
               */
              if (Notification.permission === "granted") {
                new Notification(notification.noti_type, {
                  body: notification.content_pre,
                  icon: "/logo.png"
                });
              }

            } catch (error) {
              // JSON 파싱 실패 시 기본 알림 생성
              console.error("알림 데이터 파싱 오류:", error);

              const fallbackNotification = {
                noti_idx: Date.now(),
                noti_type: "새 알림",
                content_pre: data,  // 파싱 실패한 원본 데이터를 그대로 사용
                noti_date: new Date().toISOString(),
                noti_read_yn: false,
                relate_user_id: id,
                link: null
              };

              dispatch(addNotification(fallbackNotification));
            }
          }
        }
      }

    } catch (error) {
      // 연결 중단(사용자가 페이지를 떠나거나 컴포넌트가 언마운트된 경우)
      if (error.name === 'AbortError') {
        console.log("SSE 연결이 중단됨");
      } else {
        // 네트워크 오류 등 기타 에러
        console.error("SSE 연결 오류:", error);
        setConnectionStatus('error');

        /**
         * 연결 실패 시 5초 후 자동 재연결 시도
         * 네트워크 일시적 문제나 서버 재시작 등의 상황에 대응
         */
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
      // 연결 시도 완료 (성공/실패 관계없이)
      setIsConnecting(false);
    }
  };

  /**
   * 컴포넌트 마운트 시 SSE 연결 시작
   * 의존성 배열이 빈 배열이므로 컴포넌트가 처음 마운트될 때만 실행
   */
  useEffect(() => {
    // 세션 스토리지에서 사용자 정보 가져오기
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    // 로그인된 사용자만 SSE 연결
    if (id && token) {
      connectSSE(id, token);
    }

    /**
     * 컴포넌트 언마운트 시 정리 함수
     * 메모리 누수 방지를 위해 연결을 안전하게 종료
     */
    return () => {
      console.log("SSE 연결 정리");
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // 진행 중인 fetch 요청 중단
      }
      setConnectionStatus('disconnected');
    };
  }, []); // 빈 의존성 배열: 마운트/언마운트 시에만 실행

  /**
   * 연결 상태 변화 감지 및 로깅 (개발용)
   * 연결 상태가 변경될 때마다 콘솔에 로그 출력
   */
  useEffect(() => {
    console.log("SSE 연결 상태 변경:", connectionStatus);
  }, [connectionStatus]); // connectionStatus가 변경될 때마다 실행

  /**
   * 전역 함수 등록 및 브라우저 알림 권한 요청
   * 다른 컴포넌트에서 SSE 재연결을 수동으로 트리거할 수 있도록 함
   */
  useEffect(() => {
    // window 객체에 함수 등록 (전역에서 접근 가능)
    window.connectSSE = () => {
      const id = sessionStorage.getItem("id");
      const token = sessionStorage.getItem("token");
      if (id && token) {
        connectSSE(id, token);
      }
    };

    /**
     * 브라우저 알림 권한 요청
     * 사용자가 아직 권한을 설정하지 않은 경우 권한 요청 팝업 표시
     */
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    /**
     * 컴포넌트 언마운트 시 전역 함수 제거
     * 메모리 누수 방지
     */
    return () => {
      delete window.connectSSE;
    };
  }, []); // 빈 의존성 배열: 마운트/언마운트 시에만 실행

  /**
   * 이 컴포넌트는 UI를 렌더링하지 않음
   * 백그라운드에서 SSE 연결만 관리하는 역할
   */
  return null;
}
