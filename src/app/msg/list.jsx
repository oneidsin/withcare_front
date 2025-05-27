import React from "react";
import {Pagination, Stack} from "@mui/material";
import { BsTrash } from 'react-icons/bs';
import {store} from "@/redux/store";

export default function List({msg, selectedMessages, onSelectOne}) {
    let listItem = <tr><th colSpan={6}> 쪽지가 없습니다.</th></tr>

    if(msg.list.length > 0){
        listItem = msg.list.map(item => (
            <tr key={item.id} className={!item.read ? 'unread' : ''}>
                <td>
                    <input
                        type="checkbox"
                        checked={selectedMessages.has(item.id)}
                        onChange={() => onSelectOne(item.id)}
                    />
                </td>
                <td>{item.sender}</td>
                <td className='subject-cell'>{item.subject}</td>
                <td>{item.date}</td>
                <td>{item.read ? '읽음' : '읽지 않음'}</td>
                <td>
                    <button className='icon-button'>
                        <BsTrash />
                    </button>
                </td>
            </tr>
        ))
    }
    return (
        <>
        {listItem}
            <tr>
                <th colSpan={5}>
                    <Stack spacing={2}>
                        <Pagination count={msg.pages} onChange={(e,page)=>{
                            store.dispatch({type:'msg/list',payload:page});
                        }}/>
                    </Stack>
                </th>
            </tr>
        </>
    );
}