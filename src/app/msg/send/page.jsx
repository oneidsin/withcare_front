"use client"

import '../msg.css';
import React, {useState} from "react";
import axios from "axios";
import Link from 'next/link';


export default function SendPage(){

    const [info, setInfo] = useState({id:'',receiver_id:'',msg_content:''});
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    const input=(e)=>{
        setInfo({...info, [e.target.name]: e.target.value});
    }

    const save = async (e) => {
        e.preventDefault();

        const payload = {
            sender_id: id,
            receiver_id: info.receiver_id,
            msg_content: info.msg_content,
        };

        const { data } = await axios.post('http://localhost/msg/send', payload, {
            headers: {
                Authorization: token,
                'Content-Type': 'application/json',
            }
        });

        console.log(data);
        if(data.message){
            alert('쪽지 전송을 성공 했습니다.');
            location.href='/msg/outbox';
        }
    }


    return (
        <>
            <div className='inbox-header'>
                <h1> ✍🏻 쪽지 쓰기 </h1>
            </div>
            <table className="msg-form-table">
                <colgroup>
                    <col className="label-col" />
                    <col className="input-col" />
                </colgroup>
                <tbody>
                <tr>
                    <th>보낸 사람</th>
                    <td>
                        <input
                            type="text"
                            name="sender_id"
                            value={id}
                            readOnly
                            className="readonly-input"
                        />
                    </td>
                </tr>
                <tr>
                    <th>받는 사람</th>
                    <td>
                        <input 
                            type="text" 
                            name="receiver_id" 
                            value={info.receiver_id} 
                            onChange={input}
                            className="form-input"
                        />
                    </td>
                </tr>
                <tr>
                    <th>내용</th>
                    <td>
                        <textarea 
                            name="msg_content" 
                            onChange={input} 
                            value={info.msg_content}
                            className="form-textarea"
                        ></textarea>
                    </td>
                </tr>
                </tbody>
            </table>
            <div className="msg-form-buttons">
                <div className="action-button">
                    <Link href={'/msg/outbox'} style={{ textDecoration: 'none' }}>
                        <button className='btns'>목록으로</button>
                    </Link>
                    <button className='btns' onClick={save}>보내기</button>
                </div>
            </div>
        </>
    );
}