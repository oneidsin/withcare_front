import { createSlice } from '@reduxjs/toolkit';

const blockedUsersSlice = createSlice({
  name: 'blockedUsers', // store에 등록 시 사용할 이름
  initialState: {
    // sessionStorage에서 id와 token을 가져옵니다.
    // (Next.js 13+ App Router에서는 Client Component에서만 sessionStorage 접근 가능)
    id: typeof window == 'undefined' ? "" : sessionStorage.getItem("id"),
    token: typeof window == 'undefined' ? "" : sessionStorage.getItem("token"),
    list: [],         // 차단 사용자 목록 배열
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
      state.list = action.payload;
      state.loading = false;
      state.error = null;
    },
    // 차단 해제 성공 시, 목록에서 사용자를 제거하는 리듀서
    removeBlockedUser: (state, action) => {
      state.list = state.list.filter(user => user.userId !== action.payload);
    },
    // (선택 사항) 로그인/로그아웃 시 id/token 업데이트용 리듀서
    setAuthInfo: (state, action) => {
      state.id = action.payload.id;
      state.token = action.payload.token;
      // sessionStorage에도 저장 가능
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("id", action.payload.id || "");
        sessionStorage.setItem("token", action.payload.token || "");
      }
    },
    clearAuthInfo: (state) => {
      state.id = null;
      state.token = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem("id");
        sessionStorage.removeItem("token");
      }
    }
  },
});

// 생성된 액션 생성자와 리듀서를 export 합니다.
export const {
  setLoading,
  setError,
  setBlockedUsers,
  removeBlockedUser,
  setAuthInfo,
  clearAuthInfo
} = blockedUsersSlice.actions;

export default blockedUsersSlice.reducer;