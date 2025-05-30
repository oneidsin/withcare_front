import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MemberRanking() {
    const [rankingList, setRankingList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRankingData();
    }, []);

    // 랭킹 정보 가져오기
    const loadRankingData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost/ranking');
            setRankingList(response.data);
        } catch (err) {
            console.error('랭킹 정보 로딩 실패:', err);
            setRankingList([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card small-card">
            <h2>승급자</h2>
            <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
            {loading ? (
                <p>로딩 중...</p>
            ) : rankingList.length > 0 ? (
                rankingList.slice(0, 3).map((member, idx) => (
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
                ))
            ) : (
                <p>랭킹 정보가 없습니다.</p>
            )}
        </div>
    );
} 