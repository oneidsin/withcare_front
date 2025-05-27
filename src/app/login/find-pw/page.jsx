"use client"

import "../login.css"
import {useRef} from "react";
import Link from "next/link";


export default function FindIdPage() {

    const dobRef = useRef(null);

    return (
        <div className="login">
            <img src="/logo.png" alt="withcare 로고" className="logo" />
                <p>이름</p>
                <input
                    type="text"
                    placeholder="이름을 입력하실거에요 마실거에요."
                    onKeyDown={(e) => {
                        if (e.keyCode === 13) {
                            e.preventDefault();
                        }
                    }}/>
                <p>아이디</p>
                <input
                    type="text"
                    placeholder="아이디를 입력하실거에요 마실거에요."
                    onKeyDown={(e) => {
                        if (e.keyCode === 13) {
                            e.preventDefault();
                            dobRef.current.focus();
                        }
                    }}/>
                <p>이메일</p>
                <input
                    type="text"
                    placeholder="이메일을 입력하실거에요 마실거에요."
                    onKeyDown={(e) => {
                        if (e.keyCode === 13) {
                            e.preventDefault();
                            dobRef.current.focus();
                        }
                    }}/>
                <p>생년월일</p>
                <input
                    ref={dobRef}
                    type="password"
                    placeholder="생년월일을 입력하실거에요 마실거에요."
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            login();
                        }
                    }}
                />
                <button>비밀번호 변경 페이지로 이동</button>
                <br/>
                <br/>
                <Link href="/login/find-id">아이디를 잊으셨나요?</Link>
        </div>
    );
}