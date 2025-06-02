"use client";

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closePopup, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications, fetchNotifications, resetStatuses } from '@/redux/notificationSlice';
import './NotificationPopup.css';

export default function NotificationPopup() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isPopupOpen, status, error, deleteStatus, deleteAllStatus, markAsReadStatus, markAllAsReadStatus } = useSelector(state => state.notification);
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

      // 팝업이 열리고, 로딩 중이 아니고, 실패 상태일 때만 다시 알림을 불러옵니다.
      // 이미 성공적으로 데이터를 가져온 경우에는 다시 가져오지 않습니다.
      if (currentUserId && status === 'failed') {
        dispatch(fetchNotifications({ id: currentUserId, offset: 0 }));
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen, dispatch, status]); // notifications.length 의존성 제거

  // 작업 완료 후 상태 리셋
  useEffect(() => {
    const statuses = [deleteStatus, deleteAllStatus, markAsReadStatus, markAllAsReadStatus];
    const hasSucceeded = statuses.some(status => status === 'succeeded');

    if (hasSucceeded) {
      const timer = setTimeout(() => {
        dispatch(resetStatuses());
      }, 2000); // 2초 후 상태 리셋

      return () => clearTimeout(timer);
    }
  }, [deleteStatus, deleteAllStatus, markAsReadStatus, markAllAsReadStatus, dispatch]);

  if (!isPopupOpen) return null;

  // 알림 클릭 시 처리 - 백엔드 API 호출
  const handleNotificationClick = (notification) => {
    if (!notification.noti_read_yn) {
      const currentUserId = sessionStorage.getItem('id');
      if (currentUserId) {
        dispatch(markNotificationAsRead({ id: currentUserId, noti_idx: notification.noti_idx }));
      }
    }

    // 알림 타입에 따른 페이지 이동
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  // 모든 알림 읽음 처리 - 백엔드 API 호출
  const handleMarkAllAsRead = () => {
    const currentUserId = sessionStorage.getItem('id');
    if (currentUserId) {
      dispatch(markAllNotificationsAsRead({ id: currentUserId }));
    }
  };

  // 알림 삭제 시 처리 - 백엔드 API 호출
  const handleDeleteNotification = (e, noti_idx) => {
    e.stopPropagation(); // 부모 요소(알림 아이템)의 클릭 이벤트 전파 방지

    const currentUserId = sessionStorage.getItem('id');
    if (currentUserId) {
      dispatch(deleteNotification({ id: currentUserId, noti_idx }));
    }
  };

  // 알림 전체 삭제 처리 - 백엔드 API 호출
  const handleDeleteAllNotifications = () => {
    if (window.confirm('모든 알림을 삭제하시겠습니까?')) {
      const currentUserId = sessionStorage.getItem('id');
      if (currentUserId) {
        dispatch(deleteAllNotifications({ id: currentUserId }));
      }
    }
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
          {notifications.length > 0 && (
            <>
              <button
                className={`delete-all-btn ${deleteAllStatus === 'loading' ? 'deleting' : ''}`}
                onClick={handleDeleteAllNotifications}
                disabled={deleteAllStatus === 'loading'}
                title="모든 알림 삭제"
              >
                {deleteAllStatus === 'loading' ? '삭제 중...' : '전체 삭제'}
              </button>
              {unreadCount > 0 && (
                <button
                  className={`mark-all-read-btn ${markAllAsReadStatus === 'loading' ? 'reading' : ''}`}
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadStatus === 'loading'}
                >
                  {markAllAsReadStatus === 'loading' ? '읽는 중...' : '모두 읽음'}
                </button>
              )}
            </>
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
              className={`notification-item ${!notification.noti_read_yn ? 'unread' : ''} ${markAsReadStatus === 'loading' ? 'reading' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <div className="notification-title">{notification.noti_type}</div>
                <div className="notification-message">{notification.content_pre}</div>
                <div className="notification-time">{formatTime(notification.noti_date)}</div>
              </div>
              <button
                className={`delete-notification-btn ${deleteStatus === 'loading' ? 'deleting' : ''}`}
                onClick={(e) => handleDeleteNotification(e, notification.noti_idx)}
                title="알림 삭제"
                disabled={deleteStatus === 'loading'}
              >
                {deleteStatus === 'loading' ? '⏳' : '🗑️'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}