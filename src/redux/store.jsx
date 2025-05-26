import {configureStore} from "@reduxjs/toolkit";
import userReducer from "@/redux/userReducer";

export const store = configureStore({
    reducer: {
        user: userReducer,
    },
});