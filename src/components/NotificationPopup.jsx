"use client";

import { useEffect, useRef } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import './NotificationPopup.css';

export default function NotificationPopup() {
  const {
    notifications,
    unreadCount,
    isPopupOpen,
    closePopup,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotification();

  const popupRef = useRef(null);

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closePopup();
      }
    };

    if (isPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen, closePopup]);

  if (!isPopupOpen) return null;

  // 알림 클릭 시 처리
  const handleNotificationClick = async (notification) => {
    if (!notification.noti_read_yn) {
      const success = await markAsRead(notification.noti_idx);
      if (!success) {
        console.error('알림 읽음 처리 실패');
      }
    }

    // 알림 타입별 페이지 이동 처리
    try {
      if (notification.noti_type === 'comment') {
        const res = await fetch(`http://localhost/api/comment/${notification.relate_item_id}/post-id`);
        if (res.ok) {
          const postIdx = await res.json();
          window.open(`post/detail?post_idx=${postIdx}`, '_blank');
        } else {
          alert('댓글이 작성된 게시글을 찾을 수 없습니다.');
        }
      } else if (notification.noti_type === 'mention') {
        const res = await fetch(`http://localhost/api/mention/${notification.relate_item_id}/post-id`);
        if (res.ok) {
          const postIdx = await res.json();
          window.open(`post/detail?post_idx=${postIdx}`, '_blank');
        } else {
          alert('댓글이 작성된 게시글을 찾을 수 없습니다.');
        }
      } else if (notification.noti_type === 'report') {
        window.open(`/admin/admin-report`, '_blank');
      } else {
        // 쪽지로 이동
        window.open(`/msg/detail?id=${notification.relate_item_id}&type=inbox`, '_blank');
      }
    } catch (error) {
      console.error('알림 타입별 페이지 이동 처리 오류:', error);
    }
  };


  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (!success) {
      alert('모든 알림 읽음 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 알림 삭제 시 처리
  const handleDeleteNotification = async (e, noti_idx) => {
    e.stopPropagation(); // 부모 요소(알림 아이템)의 클릭 이벤트 전파 방지

    const success = await deleteNotification(noti_idx);
    if (!success) {
      alert('알림 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 알림 전체 삭제 처리
  const handleDeleteAllNotifications = async () => {
    if (window.confirm('모든 알림을 삭제하시겠습니까?')) {
      const success = await deleteAllNotifications();
      if (!success) {
        alert('모든 알림 삭제에 실패했습니다. 다시 시도해주세요.');
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

  return (
    <div className="notification-popup" ref={popupRef}>
      <div className="notification-header">
        <h3>알림</h3>
        <div className="notification-actions">
          {notifications.length > 0 && (
            <>
              <button
                className="delete-all-btn"
                onClick={handleDeleteAllNotifications}
                title="모든 알림 삭제"
              >
                전체 삭제
              </button>
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                >
                  모두 읽음
                </button>
              )}
            </>
          )}
          <button
            className="close-btn"
            onClick={closePopup}
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
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}