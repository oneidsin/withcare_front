import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/redux/userReducer";
import blockedUsersSlice from "@/redux/blockedUsersSlice";
export const store = configureStore({
    reducer: {
        user: userReducer,
        blockedUsers: blockedUsersSlice,
    },
});