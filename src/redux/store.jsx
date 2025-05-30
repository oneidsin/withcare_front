import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/redux/userReducer";
import blockedUsersSlice from "@/redux/blockedUsersSlice";
import msgSlice from "@/redux/msgSlice";
import notificationSlice from "@/redux/notificationSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        blockedUsers: blockedUsersSlice,
        msg: msgSlice,
        notification: notificationSlice,
    },
});