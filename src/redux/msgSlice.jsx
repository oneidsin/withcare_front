import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";
import {store} from "@/redux/store";

// 받은 쪽지함 조회 액션
export const fetchInbox = createAsyncThunk(
    'msg/fetchInbox',
    async ({id, page = 1}) => {
        // 현재 로그인한 사용자의 id 확인
        const currentUserId = sessionStorage.getItem('id');
        
        // 요청하는 id와 로그인한 사용자의 id가 일치하는지 확인
        if (currentUserId !== id) {
            return { loginYN: false, inbox: [], pages: 0, currentPage: 1 };
        }

        const res = await axios.get(
            `http://localhost:80/msg/inbox/${currentUserId}?page=${page-1}`,
            {
                headers: {
                    Authorization: sessionStorage.getItem('token')
                }
            }
        );
        
        return {
            loginYN: res.data.loginYN,
            inbox: res.data.inbox || [],
            pages: res.data.pages || 0,
            currentPage: page
        };
    }
);

const msgSlice = createSlice({
    name:'msg',
    initialState:{
        id: typeof window == 'undefined'? '':sessionStorage.getItem('id'),
        token : typeof window == 'undefined'? '':sessionStorage.getItem('token'),
        list:[],
        pages:0,
        currentPage: 1,
        detail:{}
    },
    reducers: {
        set_state(state, action) {
            Object.keys(action.payload).forEach((key) => {
                state[key] = action.payload[key];
            });
        },
        del(state, action) {
            axios.delete(`http://localhost:80/msg/${state.id}/${action.payload.id}`, {
                headers: {Authorization: state.token}
            }).then(({data}) => {
                console.log(data);
                if (data.message) {
                    console.log('삭제 성공 리스트 재 호출');
                    store.dispatch({type: 'msg/del', payload: 1});
                }
            });
            }
        },

    extraReducers: (builder) => {
        builder
            .addCase(fetchInbox.fulfilled, (state, action) => {
                state.list = action.payload.inbox || [];
                state.pages = action.payload.pages || 0;
                state.currentPage = action.payload.currentPage || 1;
            })
            .addCase(fetchInbox.rejected, (state, action) => {
                state.list = [];
                state.pages = 0;
                state.currentPage = 1;
            })
    }
});

export const {set_state} = msgSlice.actions;
export default msgSlice.reducer;