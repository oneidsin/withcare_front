"use client"

import '../msg.css';
import React, {useState, useEffect} from "react";
import axios from "axios";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function SendPage(){
    const searchParams = useSearchParams();
    const replyTo = searchParams.get('reply_to');

    const [info, setInfo] = useState({id:'',receiver_id:'',msg_content:''});
    const [charCount, setCharCount] = useState(0);
    const id = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("token");

    // 답장하기로 들어온 경우 받는 사람을 자동으로 설정
    useEffect(() => {
        if (replyTo) {
            setInfo(prev => ({...prev, receiver_id: replyTo}));
        }
    }, [replyTo]);

    const input=(e)=>{
        if (e.target.name === 'msg_content') {
            setCharCount(e.target.value.length);
        }
        setInfo({...info, [e.target.name]: e.target.value});
    }

    const save = async (e) => {
        e.preventDefault();

        if (!info.receiver_id.trim()) {
            alert('받는 사람을 입력해주세요.');
            return;
        }

        if (!info.msg_content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        const payload = {
            sender_id: id,
            receiver_id: info.receiver_id,
            msg_content: info.msg_content,
        };

        try {
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
        } catch (error) {
            console.error('쪽지 전송 실패:', error);
            alert('쪽지 전송에 실패했습니다.');
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
                            readOnly={!!replyTo}
                        />
                    </td>
                </tr>
                <tr>
                    <th>내용</th>
                    <td>
                        <div className="textarea-container">
                            <textarea 
                                name="msg_content" 
                                onChange={input} 
                                value={info.msg_content}
                                className="form-textarea"
                                maxLength={200}
                                placeholder="내용을 입력해주세요."
                            ></textarea>
                            <div className="char-count">
                                {charCount}/200자
                            </div>
                        </div>
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