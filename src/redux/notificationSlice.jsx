// @/redux/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// sessionStorage에서 JWT 토큰을 가져오는 함수
const getAuthToken = () => {
  return sessionStorage.getItem('token'); // sessionStorage에서 'authToken' 키로 저장된 토큰을 가져옴
};

// thunk 함수 생성
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ id, offset = 0 }, { rejectWithValue }) => {
    try {
      const token = getAuthToken(); // 토큰 가져오기

      if (!token) {
        // 토큰이 없으면 요청을 보내지 않고 에러 처리
        return rejectWithValue('Authentication token not found in session storage.');
      }

      const response = await axios.get(`http://localhost/noti/list/${id}`, {
        params: { offset }, // offset 쿼리 파라미터 추가 (필요시)
        headers: {
          Authorization: token
        }
      });

      const apiResult = response.data.result; // 실제 알림 목록
      const loginYN = response.data.loginYN; // 백엔드에서 보낸 로그인 여부

      if (!loginYN) {
        // 백엔드에서 로그인 실패(토큰 불일치 등)를 알리는 경우
        return rejectWithValue('User not authorized or login failed on backend (token mismatch).');
      }

      const notifications = apiResult || []; // 알림 목록
      const unreadCount = notifications.filter(n => !n.isRead).length; // 읽지 않은 알림

      return { notifications, unreadCount }; // 알림 목록과 읽지 않은 알림 수 반환
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // 에러 응답이 있다면 해당 데이터, 없다면 에러 메시지를 반환
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    isPopupOpen: false,
    status: 'idle',
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },
    togglePopup: (state) => {
      state.isPopupOpen = !state.isPopupOpen;
    },
    closePopup: (state) => {
      state.isPopupOpen = false;
    },
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || '알림을 불러오는 데 실패했습니다.';
        state.notifications = [];
        state.unreadCount = 0;
      });
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  togglePopup,
  closePopup,
  removeNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;