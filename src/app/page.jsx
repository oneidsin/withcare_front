"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function HomePage() {
    const [rankingList, setRankingList] = useState([]);

    useEffect(() => {
        // 랭킹 정보 가져오기
        axios.get('http://localhost/ranking')
            .then(res => {
                setRankingList(res.data);
            })
            .catch(err => {
                console.error('랭킹 정보 로딩 실패:', err);
            });
    }, []);

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
                        {rankingList.slice(0, 3).map((member, idx) => (
                            <div key={idx} className="ranking-item-small">
                                <span className="member-name">{member.id}</span>
                                    <span className="level-name">{member.lv_name}</span>
                                <div className="level-info">
                                    {member.lv_icon && (
                                        <img
                                            src={member.lv_icon}
                                            alt="레벨 아이콘"
                                            className="level-icon"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
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
                <Link href="admin/admin-board">
                    <button className="button">관리자 페이지로 이동</button>
                </Link>
            </div>

        </div>
    );
}
