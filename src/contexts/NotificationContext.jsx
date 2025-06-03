"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // 새 알림 추가
  const addNotification = (notification) => {
    console.log('Context - 새 알림 추가:', notification);

    setNotifications(prev => [notification, ...prev]);

    if (!notification.noti_read_yn) {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('Context - unreadCount 업데이트:', prev, '->', newCount);
        return newCount;
      });
    }
  };

  // 알림 목록 설정 (API에서 불러온 데이터)
  const setNotificationList = (notificationList) => {
    console.log('Context - 알림 목록 설정:', notificationList.length);
    setNotifications(notificationList);
    const unread = notificationList.filter(n => !n.noti_read_yn).length;
    setUnreadCount(unread);
    console.log('Context - unreadCount 설정:', unread);
  };

  // 알림 읽음 처리 (백엔드 API 호출 포함)
  const markAsRead = async (noti_idx) => {
    try {
      const id = sessionStorage.getItem("id");
      const token = sessionStorage.getItem("token");

      if (!id || !token) {
        console.error('로그인 정보가 없습니다.');
        return false;
      }

      console.log(`알림 읽음 처리 API 호출: ${id}/${noti_idx}`);

      const response = await fetch(`http://localhost:80/noti/read/${id}/${noti_idx}`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('알림 읽음 처리 결과:', result);

      if (result.success) {
        // 백엔드 성공 시에만 프론트엔드 상태 업데이트
        setNotifications(prev =>
          prev.map(n =>
            n.noti_idx === noti_idx ? { ...n, noti_read_yn: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      } else {
        console.error('알림 읽음 처리 실패');
        return false;
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      return false;
    }
  };

  // 모든 알림 읽음 처리 (백엔드 API 호출 포함)
  const markAllAsRead = async () => {
    try {
      const id = sessionStorage.getItem("id");
      const token = sessionStorage.getItem("token");

      if (!id || !token) {
        console.error('로그인 정보가 없습니다.');
        return false;
      }

      console.log(`모든 알림 읽음 처리 API 호출: ${id}`);

      const response = await fetch(`http://localhost:80/noti/readAll/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('모든 알림 읽음 처리 결과:', result);

      if (result.success) {
        // 백엔드 성공 시에만 프론트엔드 상태 업데이트
        setNotifications(prev =>
          prev.map(n => ({ ...n, noti_read_yn: true }))
        );
        setUnreadCount(0);
        return true;
      } else {
        console.error('모든 알림 읽음 처리 실패');
        return false;
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
      return false;
    }
  };

  // 알림 삭제 (백엔드 API 호출 포함)
  const deleteNotification = async (noti_idx) => {
    try {
      const id = sessionStorage.getItem("id");
      const token = sessionStorage.getItem("token");

      if (!id || !token) {
        console.error('로그인 정보가 없습니다.');
        return false;
      }

      console.log(`알림 삭제 API 호출: ${id}/${noti_idx}`);

      const response = await fetch(`http://localhost:80/noti/del/${id}/${noti_idx}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('알림 삭제 결과:', result);

      if (result.success) {
        // 백엔드 성공 시에만 프론트엔드 상태 업데이트
        setNotifications(prev => {
          const notification = prev.find(n => n.noti_idx === noti_idx);
          if (notification && !notification.noti_read_yn) {
            setUnreadCount(count => Math.max(0, count - 1));
          }
          return prev.filter(n => n.noti_idx !== noti_idx);
        });
        return true;
      } else {
        console.error('알림 삭제 실패');
        return false;
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      return false;
    }
  };

  // 모든 알림 삭제 (백엔드 API 호출 포함)
  const deleteAllNotifications = async () => {
    try {
      const id = sessionStorage.getItem("id");
      const token = sessionStorage.getItem("token");

      if (!id || !token) {
        console.error('로그인 정보가 없습니다.');
        return false;
      }

      console.log(`모든 알림 삭제 API 호출: ${id}`);

      const response = await fetch(`http://localhost:80/noti/delAll/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('모든 알림 삭제 결과:', result);

      if (result.success) {
        // 백엔드 성공 시에만 프론트엔드 상태 업데이트
        setNotifications([]);
        setUnreadCount(0);
        return true;
      } else {
        console.error('모든 알림 삭제 실패');
        return false;
      }
    } catch (error) {
      console.error('모든 알림 삭제 오류:', error);
      return false;
    }
  };

  // 팝업 토글
  const togglePopup = () => {
    setIsPopupOpen(prev => !prev);
  };

  // 팝업 닫기
  const closePopup = () => {
    setIsPopupOpen(false);
  };

  // 전역에서 접근 가능하도록 설정
  useEffect(() => {
    window.notificationContext = {
      addNotification,
      setNotificationList,
      unreadCount,
      notifications
    };
  }, [unreadCount, notifications]);

  const value = {
    unreadCount,
    notifications,
    isPopupOpen,
    addNotification,
    setNotificationList,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    togglePopup,
    closePopup
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
} 