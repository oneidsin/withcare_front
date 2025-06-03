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

  // 알림 읽음 처리
  const markAsRead = (noti_idx) => {
    setNotifications(prev =>
      prev.map(n =>
        n.noti_idx === noti_idx ? { ...n, noti_read_yn: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, noti_read_yn: true }))
    );
    setUnreadCount(0);
  };

  // 알림 삭제
  const deleteNotification = (noti_idx) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.noti_idx === noti_idx);
      if (notification && !notification.noti_read_yn) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.noti_idx !== noti_idx);
    });
  };

  // 모든 알림 삭제
  const deleteAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
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