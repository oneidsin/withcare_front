"use client"

import "./login.css"
import { useDispatch } from "react-redux";
import { useState, useRef } from "react";
import { setUser } from "@/redux/userReducer";
import { useRouter } from "next/navigation";
import Link from "next/link";  // useRouter 임포트

export default function LoginPage() {

    const dispatch = useDispatch();
    const router = useRouter();  // useRouter 사용
    const pwInputRef = useRef(null);

    const [id, setId] = useState('');
    const [pw, setPw] = useState('');

    const login = async () => {
        const res = await fetch('http://localhost:80/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id, pw}),
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem('token', data.token);
            dispatch(setUser({ id, token: data.token }));
            window.location.href = '/';  // 홈('/')으로 이동
        } else {
            alert("로그인 실패: 아이디 또는 비밀번호 확인해주세요.");
        }
    };

    return (
        <div className="login">
            <img src="/logo.png" alt="withcare 로고" className="logo" />
            <div className="idpw">
            <p> 아이디 </p>
            <input
                type="text"
                placeholder="아이디를 입력하세요."
                value={id}
                onChange={(e) => setId(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        pwInputRef.current.focus();
                    }
                }}
            />
            <p> 비밀번호 </p>
            <input
                ref={pwInputRef}
                type="password"
                placeholder="비밀번호를 입력하세요."
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        login();
                    }
                }}
            />
            </div>
            <br/>
            <button onClick={login}>로그인</button>
            <br/>
            <button> 회원가입 </button>
            <p>
                <Link href="/login/find-id">아이디를 잊으셨나요?</Link>
                <br/>
                <Link href="/login/find-pw">비밀번호를 잊으셨나요?</Link>
            </p>
        </div>
    );
}
