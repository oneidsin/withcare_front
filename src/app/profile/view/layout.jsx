'use client';

export default function ViewProfileLayout({ children }) {
    // 타인 프로필 페이지에서는 사이드바를 완전히 제거
    // 부모 레이아웃의 SidebarLayout을 완전히 우회
    return (
        <div style={{ 
            width: '100%', 
            minHeight: '100vh',
            padding: 0,
            margin: 0,
            backgroundColor: '#f5f5f5'
        }}>
            {children}
        </div>
    );
} 