import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    id: null,
    token: null,
};

const userReducer = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action) {
            state.id = action.payload.id;
            state.token = action.payload.token;
        },
        logout(state) {
            state.id = null;
            state.token = null;
            localStorage.removeItem('token');
        },
    },
});

export const { setUser, logout } = userReducer.actions;
export default userReducer.reducer;
