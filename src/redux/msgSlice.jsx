import {createSlice} from "@reduxjs/toolkit";
import {store} from "@/redux/store";
import axios from "axios";

const msgSlice = createSlice({
    name:'msg',
    initialState:{
        id: typeof window == 'undefined'? '':sessionStorage.getItem('id'),
        token : typeof window == 'undefined'? '':sessionStorage.getItem('token'),
        list:[],
        pages:0,
        detail:{},
    },
    reducers:{
        set_state(state, action){
            Object.keys(action.payload).forEach((key)=>{
                state[key] = action.payload[key];
            });
            return state;
        },
        list(state, action){
            axios.get(`http://localhost:80/msg/outbox/${state.id}/${action.payload}`
            ,{headers:{Authorization: state.token}}).then(({data}) => {
                console.log(data);
                store.dispatch({type:'msg/outbox',payload: {pages:data.pages, list:data.list}});
            });
        }
    }
});

export default msgSlice.reducer;