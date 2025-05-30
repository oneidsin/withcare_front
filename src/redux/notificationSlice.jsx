import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [], // 알림 목록
    unreadCount: 0,    // 읽지 않은 알림 수
    isPopupOpen: false, // 알림 팝업 열림 상태
  },
  reducers: {
    // 새 알림 추가
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    // 알림 목록 설정 (초기 로드 시)
    setNotifications: (state, action) => {
      state.notifications = action.payload.notifications || [];
      state.unreadCount = action.payload.unreadCount || 0;
    },
    // 알림 읽음 처리
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    // 모든 알림 읽음 처리
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },
    // 알림 팝업 토글
    togglePopup: (state) => {
      state.isPopupOpen = !state.isPopupOpen;
    },
    // 알림 팝업 닫기
    closePopup: (state) => {
      state.isPopupOpen = false;
    },
    // 알림 삭제
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const index = state.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
  },
});

export const {
  addNotification,
  setNotifications,
  markAsRead,
  markAllAsRead,
  togglePopup,
  closePopup,
  removeNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer; 