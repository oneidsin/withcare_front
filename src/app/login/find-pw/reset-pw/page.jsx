"use client"

import "./../../login.css"

export default function resetPw() {
    return (
        <>
            <div className="login">
                <img src="/logo.png" alt="withcare 로고" className="logo" />
                <p> 비밀번호 </p>
                <input
                    type="password"
                    placeholder="변경할 비밀번호를 입력하세요."
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {

                        }
                    }}
                />
                <button> 비밀번호 변경 </button>
            </div>
        </>
    )
}