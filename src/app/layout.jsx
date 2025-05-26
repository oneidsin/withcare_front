// app/layout.jsx
import './app.css'

export const metadata = {
    title: '커뮤니티',
    description: '커뮤니티 플랫폼',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
        <head>
            <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        </head>
        <body>
        <header className="header">
            <img src="/logo.png" alt="withcare 로고" className="logo" />
        </header>
        <nav>
            <a href="#">공지사항</a>
            <a href="#">자유 게시판</a>
            <a href="#">Q&A</a>
            <a href="#">정보 게시판</a>
            <a href="#">환우 게시판</a>
            <a href="#">완치 후의 삶</a>
            <a href="#">랭킹</a>
        </nav>
        <main className="container">{children}</main>
        <footer>ⓒ 2025 withcare</footer>
        </body>
        </html>
    )
}
