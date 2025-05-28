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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, pw }),
        });

        const data = await res.json();
        console.log('로그인 응답 데이터:', data); // 응답 데이터 확인

        if (data.success) {
            console.log('저장하려는 id:', data);
            console.log('저장하려는 id:', data.id);
            console.log('저장하려는 token:', data.token);

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('id', id);
            sessionStorage.setItem('loginSuccess', 'true'); // alert 용

            window.dispatchEvent(new Event("login")); // ✅ 이거 꼭 있어야 RootLayout에서 로그인 상태 반영됨

            // SSE 연결 트리거
            setTimeout(() => {
                if (window.connectSSE) {
                    window.connectSSE();
                }
            }, 100); // sessionStorage 저장 후 약간의 지연

            dispatch(setUser({ id: data.id, token: data.token }));
            router.push('/');
        } else {
            alert("로그인 실패: 아이디 또는 비밀번호 확인해주세요.");
        }
    };

    return (
        <div className="login">
            <img src="/logo.png" alt="withcare 로고" className="logo" />
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
            <br />
            <button onClick={login}>로그인</button>
            <br />
            <Link href="/login/join">
                <button> 회원가입 </button>
            </Link>
            <p>
                <Link href="/login/find-id">아이디를 잊으셨나요?</Link>
                <br />
                <Link href="/login/find-pw">비밀번호를 잊으셨나요?</Link>
            </p>
        </div>
    );
}
