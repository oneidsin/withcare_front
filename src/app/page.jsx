"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './app.css'

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // 메인 페이지로 리다이렉트
        router.replace('/main');
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
            <p>메인 페이지로 이동 중...</p>
        </div>
    );
}
