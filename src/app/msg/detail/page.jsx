"use client"

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import '../msg.css';
import Link from 'next/link';

export default function MessageDetail() {
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    
    // URL 파라미터에서 필요한 정보 추출
    const msgId = searchParams.get('id');
    const type = searchParams.get('type'); // 'inbox' 또는 'outbox'
    
    useEffect(() => {
        const fetchMessageDetail = async () => {
            const id = sessionStorage.getItem('id');
            const token = sessionStorage.getItem('token');
            
            const { data } = await axios.get(
                `http://localhost/msg/detail/${id}/${msgId}`,
                {
                    headers: { Authorization: token }
                }
            );
            
            if (data.loginYN && data.msg) {
                setMessage(data.msg);
            }
            setLoading(false);
        };

        if (msgId) {
            fetchMessageDetail();
        }
    }, [msgId]);

    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (!message) {
        return <div>메시지를 찾을 수 없습니다.</div>;
    }

    return (
        <div className='inbox-container'>
            <div className='inbox-header'>
                <h1>📝 쪽지 내용</h1>
            </div>
            
            <table className="msg-form-table">
                <tbody>
                    <tr>
                        <th>{type === 'inbox' ? '보낸 사람' : '받는 사람'}</th>
                        <td>
                            <input
                                type="text"
                                value={type === 'inbox' ? message.sender_id : message.receiver_id}
                                readOnly
                                className="readonly-input"
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>보낸 시간</th>
                        <td>
                            <input
                                type="text"
                                value={new Date(message.msg_sent_at).toLocaleString()}
                                readOnly
                                className="readonly-input"
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>내용</th>
                        <td>
                            <div className="textarea-container">
                                <textarea
                                    value={message.msg_content}
                                    readOnly
                                    className="form-textarea"
                                />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="msg-form-buttons">
                <div className="action-button">
                    <Link href={type === 'inbox' ? '/msg' : '/msg/outbox'}>
                        <button className='btns'>목록으로</button>
                    </Link>
                    {type === 'inbox' && (
                        <Link href={`/msg/send?reply_to=${message.sender_id}`}>
                            <button className='btns'>답장하기</button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}