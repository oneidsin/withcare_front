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

      console.log(response.data);

      const apiResult = response.data.result; // 실제 알림 목록
      const loginYN = response.data.loginYN; // 백엔드에서 보낸 로그인 여부

      if (!loginYN) {
        // 백엔드에서 로그인 실패(토큰 불일치 등)를 알리는 경우
        return rejectWithValue('User not authorized or login failed on backend (token mismatch).');
      }

      const notifications = apiResult || []; // 백엔드 데이터를 그대로 사용
      const unreadCount = notifications.filter(n => !n.noti_read_yn).length; // 읽지 않은 알림

      return { notifications, unreadCount }; // 알림 목록과 읽지 않은 알림 수 반환
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // 에러 응답이 있다면 해당 데이터, 없다면 에러 메시지를 반환
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

// 알림 삭제 thunk 함수
export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async ({ id, noti_idx }, { rejectWithValue }) => {
    try {
      const token = getAuthToken(); // 토큰 가져오기

      if (!token) {
        return rejectWithValue('Authentication token not found in session storage.');
      }

      const response = await axios.delete(`http://localhost/noti/del/${id}/${noti_idx}`, {
        headers: {
          Authorization: token
        }
      });

      console.log('Delete notification response:', response.data);

      if (response.data.success) {
        return { noti_idx }; // 삭제 성공 시 noti_idx 반환
      } else {
        return rejectWithValue('알림 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

// 알림 전체 삭제 thunk 함수
export const deleteAllNotifications = createAsyncThunk(
  'notification/deleteAllNotifications',
  async ({ id }, { rejectWithValue }) => {
    try {
      const token = getAuthToken(); // 토큰 가져오기

      if (!token) {
        return rejectWithValue('Authentication token not found in session storage.');
      }

      const response = await axios.delete(`http://localhost/noti/delAll/${id}`, {
        headers: {
          Authorization: token
        }
      });

      console.log('Delete all notifications response:', response.data);

      if (response.data.success) {
        return { success: true }; // 전체 삭제 성공
      } else {
        return rejectWithValue('알림 전체 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

// 알림 읽음 처리 thunk 함수
export const markNotificationAsRead = createAsyncThunk(
  'notification/markNotificationAsRead',
  async ({ id, noti_idx }, { rejectWithValue }) => {
    try {
      const token = getAuthToken(); // 토큰 가져오기

      if (!token) {
        return rejectWithValue('Authentication token not found in session storage.');
      }

      const response = await axios.put(`http://localhost/noti/read/${id}/${noti_idx}`, {}, {
        headers: {
          Authorization: token
        }
      });

      console.log('Mark as read response:', response.data);

      if (response.data.success) {
        return { noti_idx }; // 읽음 처리 성공 시 noti_idx 반환
      } else {
        return rejectWithValue('알림 읽음 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

// 모든 알림 읽음 처리 thunk 함수
export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllNotificationsAsRead',
  async ({ id }, { rejectWithValue }) => {
    try {
      const token = getAuthToken(); // 토큰 가져오기

      if (!token) {
        return rejectWithValue('Authentication token not found in session storage.');
      }

      const response = await axios.put(`http://localhost/noti/readAll/${id}`, {}, {
        headers: {
          Authorization: token
        }
      });

      console.log('Mark all as read response:', response.data);

      if (response.data.success) {
        return { success: true }; // 모든 알림 읽음 처리 성공
      } else {
        return rejectWithValue('모든 알림 읽음 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
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
    deleteStatus: 'idle', // 삭제 상태 추가
    deleteAllStatus: 'idle', // 전체 삭제 상태 추가
    markAsReadStatus: 'idle', // 읽음 처리 상태 추가
    markAllAsReadStatus: 'idle', // 모든 알림 읽음 처리 상태 추가
  },
  reducers: {
    addNotification: (state, action) => {
      const newNotification = action.payload;
      console.log('addNotification 호출됨:', newNotification);
      console.log('현재 unreadCount:', state.unreadCount);

      // 새 알림을 맨 앞에 추가
      state.notifications.unshift(newNotification);

      // 읽지 않은 알림이면 카운트 증가
      if (!newNotification.noti_read_yn) {
        state.unreadCount += 1;
        console.log('unreadCount 증가됨:', state.unreadCount);
      } else {
        console.log('이미 읽은 알림이므로 카운트 증가 안함');
      }
    },
    // 로컬에서만 읽음 처리 (백엔드 호출 없이)
    markAsReadLocal: (state, action) => {
      const noti_idx = action.payload;
      const notification = state.notifications.find(n => n.noti_idx === noti_idx);
      if (notification && !notification.noti_read_yn) {
        notification.noti_read_yn = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    // 로컬에서만 모든 알림 읽음 처리 (백엔드 호출 없이)
    markAllAsReadLocal: (state) => {
      state.notifications.forEach(notification => {
        notification.noti_read_yn = true;
      });
      state.unreadCount = 0;
    },
    togglePopup: (state) => {
      state.isPopupOpen = !state.isPopupOpen;
    },
    closePopup: (state) => {
      state.isPopupOpen = false;
    },
    // 상태 리셋
    resetStatuses: (state) => {
      state.deleteStatus = 'idle';
      state.deleteAllStatus = 'idle';
      state.markAsReadStatus = 'idle';
      state.markAllAsReadStatus = 'idle';
    },
    // 로컬에서만 알림 제거 (백엔드 호출 없이)
    removeNotificationLocal: (state, action) => {
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
      })
      // 알림 삭제 관련 케이스들
      .addCase(deleteNotification.pending, (state) => {
        state.deleteStatus = 'loading';
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        const { noti_idx } = action.payload;
        // 삭제된 알림을 state에서 제거
        const index = state.notifications.findIndex(n => n.noti_idx === noti_idx);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.noti_read_yn) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.error = action.payload || '알림 삭제에 실패했습니다.';
      })
      // 알림 전체 삭제 관련 케이스들
      .addCase(deleteAllNotifications.pending, (state) => {
        state.deleteAllStatus = 'loading';
      })
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.deleteAllStatus = 'succeeded';
        // 모든 알림 제거
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(deleteAllNotifications.rejected, (state, action) => {
        state.deleteAllStatus = 'failed';
        state.error = action.payload || '알림 전체 삭제에 실패했습니다.';
      })
      // 알림 읽음 처리 관련 케이스들
      .addCase(markNotificationAsRead.pending, (state) => {
        state.markAsReadStatus = 'loading';
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.markAsReadStatus = 'succeeded';
        const { noti_idx } = action.payload;
        // 해당 알림을 읽음 처리
        const notification = state.notifications.find(n => n.noti_idx === noti_idx);
        if (notification && !notification.noti_read_yn) {
          notification.noti_read_yn = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.markAsReadStatus = 'failed';
        state.error = action.payload || '알림 읽음 처리에 실패했습니다.';
      })
      // 모든 알림 읽음 처리 관련 케이스들
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.markAllAsReadStatus = 'loading';
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.markAllAsReadStatus = 'succeeded';
        // 모든 알림을 읽음 처리
        state.notifications.forEach(notification => {
          notification.noti_read_yn = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.markAllAsReadStatus = 'failed';
        state.error = action.payload || '모든 알림 읽음 처리에 실패했습니다.';
      });
  },
});

export const {
  addNotification,
  markAsReadLocal,
  markAllAsReadLocal,
  togglePopup,
  closePopup,
  resetStatuses,
  removeNotificationLocal,
} = notificationSlice.actions;

export default notificationSlice.reducer;