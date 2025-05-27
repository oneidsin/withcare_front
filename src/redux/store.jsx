import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/redux/userReducer";
import blockedUsersReducer from "@/redux/blockUserReducer";
const store = configureStore({
    reducer: {
        user: userReducer,
        blockedUsers: blockedUsersReducer,
    },
});

export default store;