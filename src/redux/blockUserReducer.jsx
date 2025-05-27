import { createSlice } from '@reduxjs/toolkit';

// 차단 사용자 목록을 관리하는 리듀서
const blockedUsersSlice = createSlice({
  name: 'blockedUsers', // store에 등록 시 사용할 이름
  initialState: {
    id: typeof window == 'undefined' ? "" : sessionStorage.getItem('id'),
    token: typeof window == 'undefined' ? "" : sessionStorage.getItem('token'),
    list: [],         // 차단 사용자 목록 배열 (초기값은 빈 배열)
    loading: false,   // 로딩 상태
    error: null,      // 에러 정보
  },
  reducers: {
    // 로딩 시작을 알리는 리듀서
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    // 에러 상태를 설정하는 리듀서
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false; // 에러 발생 시 로딩 종료
    },
    // API 호출 성공 시, 목록을 설정하는 리듀서
    setBlockedUsers: (state, action) => {
      state.list = action.payload; // action.payload에 서버에서 받은 목록이 담겨 올 것임
      state.loading = false;
      state.error = null;
    },
    // 차단 해제 성공 시, 목록에서 사용자를 제거하는 리듀서
    removeBlockedUser: (state, action) => {
      // action.payload에는 차단 해제된 사용자 ID가 담겨 올 것임
      state.list = state.list.filter(user => user.userId !== action.payload);
    },
  },
});

// 생성된 액션 생성자(action creators)와 리듀서를 export 합니다.
export const { setLoading, setError, setBlockedUsers, removeBlockedUser } = blockedUsersSlice.actions;
export default blockedUsersSlice.reducer;