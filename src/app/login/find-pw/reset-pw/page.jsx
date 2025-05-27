"use client"

import "../../login.css"
import {useState, useEffect} from "react";
import {useSearchParams} from 'next/navigation';

export default function ResetPwPage() {
    const searchParams = useSearchParams();
    const [info, setInfo] = useState({
        id: '',
        newPw: '',
        confirmPw: ''
    });
    const [result, setResult] = useState('');

    useEffect(() => {
        // URL에서 id 파라미터 가져오기
        const id = searchParams.get('id');
        if (id) {
            setInfo(prev => ({...prev, id}));
        }
    }, [searchParams]);

    const save = (e) => {
        const {name, value} = e.target;
        setInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetPw = async () => {
        if (!info.newPw || !info.confirmPw) {
            alert("새 비밀번호를 입력해주세요.");
            return;
        }

        if (info.newPw !== info.confirmPw) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        const res = await fetch('http://localhost/reset-pw', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: info.id,
                newPw: info.newPw
            })
        });

        if (res.ok) {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            window.location.href = '/login';
        } else {
            setResult('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className="login">
            <img src="/logo.png" alt="withcare 로고" className="logo" />
            <h3>비밀번호 재설정</h3>
            <hr/>
            <br/>
            <table>
                <tbody>
                    <tr>
                        <th>새 비밀번호</th>
                        <td>
                            <input
                                type="password"
                                name="newPw"
                                value={info.newPw}
                                onChange={save}
                                placeholder="새 비밀번호를 입력하세요"
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>비밀번호 확인</th>
                        <td>
                            <input
                                type="password"
                                name="confirmPw"
                                value={info.confirmPw}
                                onChange={save}
                                placeholder="비밀번호를 다시 입력하세요"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{marginTop: '20px', textAlign: 'center'}}>
                <button onClick={resetPw}>
                    비밀번호 변경
                </button>
            </div>

            {result && (
                <p style={{textAlign: 'center', marginTop: '20px', color: '#333', fontSize: '16px'}}>
                    {result}
                </p>
            )}
        </div>
    );
}