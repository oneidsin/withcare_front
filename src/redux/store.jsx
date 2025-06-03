import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/redux/userReducer";
import blockedUsersSlice from "@/redux/blockedUsersSlice";
import msgSlice from "@/redux/msgSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        blockedUsers: blockedUsersSlice,
        msg: msgSlice,
    },
    devTools: process.env.NODE_ENV !== 'production', // Redux DevTools 활성화
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

// 디버깅을 위해 전역에서 store 접근 가능하도록 설정
if (typeof window !== 'undefined') {
    window.store = store;
}