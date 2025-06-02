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

            // 회원가입에서 저장된 이름이 있는지 확인
            const signupName = sessionStorage.getItem('signupName');
            
            if (signupName) {
                // 회원가입에서 저장된 이름이 있으면 바로 사용
                sessionStorage.setItem('name', signupName);
                sessionStorage.removeItem('signupName'); // 일회용이므로 제거
                console.log('회원가입 저장 이름 사용:', signupName);
                
                // 새 회원은 프로필 사진이 없으므로 기본 이미지 설정
                sessionStorage.setItem('profilePic', '/defaultProfileImg.png');
                console.log('새 회원 기본 프로필 이미지 설정');
                
                // 사이드바 업데이트를 위한 이벤트 발생
                window.dispatchEvent(new Event('profileUpdated'));
            } else {
                // 회원가입 이름이 없으면 프로필 API에서 가져오기
                try {
                    const profileRes = await fetch(`http://localhost:80/profile/${id}`, {
                        headers: { 'Authorization': data.token }
                    });
                    
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        console.log('프로필 데이터:', profileData);
                        
                        if (profileData.status === "success" && profileData.data) {
                            const userData = profileData.data;
                            
                            // 사용자 이름 저장
                            if (userData.name) {
                                sessionStorage.setItem('name', userData.name);
                                console.log('사용자 이름 저장:', userData.name);
                            }
                            
                            // 프로필 이미지 저장
                            if (userData.profile_photo) {
                                const profileImageUrl = getValidImageUrl(userData.profile_photo);
                                sessionStorage.setItem('profilePic', profileImageUrl);
                                console.log('프로필 이미지 저장:', profileImageUrl);
                            }
                        }
                    } else {
                        console.log('프로필 정보 가져오기 실패, 기본값 사용');
                    }
                } catch (error) {
                    console.error('프로필 정보 가져오기 오류:', error);
                    // 프로필 정보 가져오기 실패해도 로그인은 계속 진행
                }
            }

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

    // 유효한 이미지 URL 생성 함수
    const getValidImageUrl = (url) => {
        if (!url || url === 'null' || url === 'undefined') {
            return "/defaultProfileImg.png";
        }
        
        // URL이 이미 http://로 시작하는지 확인
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // URL이 /로 시작하는지 확인 (절대 경로)
        if (url.startsWith('/')) {
            return `http://localhost${url}`;
        }
        
        // profile/ 경로로 시작하는 경우 file/ 접두사 추가
        if (url.startsWith('profile/')) {
            return `http://localhost/file/${url}`;
        }
        
        // 그 외의 경우 백엔드 기본 URL에 경로 추가
        return `http://localhost/${url}`;
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
