"use client";

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closePopup, markAsRead, markAllAsRead, removeNotification } from '@/redux/notificationSlice';
import './NotificationPopup.css';

export default function NotificationPopup() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isPopupOpen } = useSelector(state => state.notification);
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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen, dispatch]);

  if (!isPopupOpen) return null;

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

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
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

  // 알림 불러오기
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost/noti/list/${id}`);
      console.log(res.data);
      dispatch(setNotifications(res.data));
    } catch (error) {
      console.error('알림 불러오기 실패:', error);
    }
  };

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
              key={notification.id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{formatTime(notification.timestamp)}</div>
              </div>
              <button
                className="delete-notification-btn"
                onClick={(e) => handleDeleteNotification(e, notification.id)}
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