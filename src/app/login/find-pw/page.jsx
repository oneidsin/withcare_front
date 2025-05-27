"use client"

import "../login.css"
import {useRef, useState} from "react";
import Link from "next/link";

export default function FindPwPage() {

    const [info, setInfo] = useState({name: "", id:"", year: "", email:""});
    const [result, setResult] = useState("");

    const save = (e) => {
        const {name,value} = e.target;
        setInfo(prev=>({...prev, [name]:value}));
    };

    const findPw = async () => {
        if(!info.name || !info.id || !info.year || !info.email) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        const res = await fetch(`http://localhost:80/find-pw?name=${info.name}&id=${info.id}&year=${info.year}&email=${info.email}`);
        const data = await res.text();

        setResult(res.ok ? `회원님의 비밀번호는 ${data}입니다.` : (data || '일치하는 회원 정보가 없습니다.'));
    }

    return (
        <div className="login">
            <img src="/logo.png" alt="withcare 로고" className="logo" />
            <h3>비밀번호 찾기</h3>
            <hr/>
            <br/>
            <table>
                <tbody>
                <tr>
                    <th>이름</th>
                    <td>
                        <input
                            type="text"
                            name="name"
                            value={info.name}
                            onChange={save}
                            placeholder="이름을 입력하세요"
                        />
                    </td>
                </tr>
                <tr>
                    <th>아이디</th>
                    <td>
                        <input
                            type="text"
                            name="id"
                            value={info.id}
                            onChange={save}
                            placeholder="아이디를 입력하세요"
                        />
                    </td>
                </tr>
                <tr>
                    <th>출생연도</th>
                    <td>
                        <input
                            type="text"
                            name="year"
                            value={info.year}
                            onChange={save}
                            placeholder="출생연도를 입력하세요"
                        />
                    </td>
                </tr>
                <tr>
                    <th>이메일</th>
                    <td>
                        <input
                            type="email"
                            name="email"
                            value={info.email}
                            onChange={save}
                            placeholder="이메일을 입력하세요"
                        />
                    </td>
                </tr>
                </tbody>
            </table>

            <div style={{marginTop: '20px', textAlign: 'center'}}>
                <button onClick={findPw} style={{width: '100%', marginBottom: '10px'}}>
                    비밀번호 변경 페이지로 이동
                </button>
            </div>
            {result && (
                <p style={{textAlign: 'center', marginTop: '20px', color: '#333', fontSize: '16px'}}>
                    {result}
                </p>
            )}
            <br/>
            <br/>
            <Link href="/login/find-id">아이디를 잊으셨나요?</Link>
        </div>
    );
}