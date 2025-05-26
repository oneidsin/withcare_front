export default function HomePage() {
    return (
        <div className="main-layout">
            <div className="top-row">
                {/* 정보 게시판 */}
                <div className="card large-card">
                    <h2>정보 게시판</h2>
                    <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
                    <p> 뭘보세요 </p>
                    <button className="button">보지마세요</button>
                </div>

                {/* 인기 검색어 + 승급자 */}
                <div className="right-panel">
                    <div className="card small-card">
                        <h2>인기 검색어</h2>
                        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
                        <p>1. 아이고</p>
                        <p>2. 내일은</p>
                        <p>3. 주말인데예</p>
                    </div>
                    <div className="card small-card">
                        <h2>승급자</h2>
                        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
                        <p>안녕하세요 🔥</p>
                        <p>안녕하겠나요 🥈</p>
                    </div>
                </div>
            </div>

            {/* 추천글 */}
            <div className="card mini-card">
                <h2>추천글</h2>
                <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
                <p>봐도 됩니다</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="button">관리자 페이지로 이동</button>
            </div>

        </div>
    );
}
