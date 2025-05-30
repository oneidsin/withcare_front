"use client";

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closePopup, markAsRead, markAllAsRead, removeNotification, fetchNotifications } from '@/redux/notificationSlice';
import './NotificationPopup.css';

export default function NotificationPopup() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isPopupOpen, status, error } = useSelector(state => state.notification);
  const popupRef = useRef(null);

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        dispatch(closePopup());
      }
    };

    if (isPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);

      // 세션 스토리지에서 사용자 ID 가져오기
      const currentUserId = sessionStorage.getItem('id');

      // 팝업이 열리고 (isPopupOpen === true)
      // 알림 로딩 상태가 'idle' (아직 데이터를 불러오지 않았거나 이전 작업이 완료된 상태) 일 때
      // 그리고 유효한 사용자 ID가 있을 때만 알림을 불러옵니다.
      if (currentUserId && status === 'idle') {
        // fetchNotifications thunk를 디스패치합니다.
        // 백엔드 API가 id와 offset을 받으므로, 객체 형태로 전달합니다.
        dispatch(fetchNotifications({ id: currentUserId, offset: 0 }));
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen, dispatch, status]); // currentUserId는 의존성 배열에서 제거 (useEffect 내부에서 가져오므로)

  if (!isPopupOpen) return null;

  // 알림 클릭 시 처리
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }

    // 알림 타입에 따른 페이지 이동
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  // 알림 삭제 시 처리
  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation(); // 부모 요소(알림 아이템)의 클릭 이벤트 전파 방지
    dispatch(removeNotification(notificationId));
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  if (status === 'failed') {
    return (
      <div className="notification-popup" ref={popupRef}>
        <div className="notification-header">
          <h3>알림</h3>
          <button className="close-btn" onClick={() => dispatch(closePopup())}>✕</button>
        </div>
        <div className="notification-list">
          <div className="no-notifications">알림을 불러오는 데 실패했습니다: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-popup" ref={popupRef}>
      <div className="notification-header">
        <h3>알림</h3>
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              모두 읽음
            </button>
          )}
          <button
            className="close-btn"
            onClick={() => dispatch(closePopup())}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            새로운 알림이 없습니다.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.noti_idx}
              className={`notification-item ${!notification.noti_read_yn ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <div className="notification-title">{notification.noti_type}</div>
                <div className="notification-message">{notification.content_pre}</div>
                <div className="notification-time">{formatTime(notification.noti_date)}</div>
              </div>
              <button
                className="delete-notification-btn"
                onClick={(e) => handleDeleteNotification(e, notification.noti_idx)}
                title="알림 삭제"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}