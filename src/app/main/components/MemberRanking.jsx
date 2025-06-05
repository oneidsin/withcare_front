import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function MemberRanking() {
    const router = useRouter();
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
            console.log('랭킹 데이터 응답:', response.data); // 응답 데이터 확인
            setRankingList(response.data);
        } catch (err) {
            console.error('랭킹 정보 로딩 실패:', err);
            setRankingList([]);
        } finally {
            setLoading(false);
        }
    };

    // 날짜 포맷 함수 - 시간까지 표시
    const formatDate = (dateString) => {
        if (!dateString) return '날짜 없음';
        const date = new Date(dateString);
        
        // 월/일 시:분 형식으로 표시
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${month}/${day} ${hours}:${minutes}`;
    };

    // 사용자 프로필로 이동하는 함수
    const handleUserClick = (userId) => {
        if (userId) {
            router.push(`/profile/view/${userId}`);
        }
    };

    return (
        <div className="card small-card">
            <h2>승급자</h2>
            <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
            {loading ? (
                <p>로딩 중...</p>
            ) : rankingList.length > 0 ? (
                rankingList.slice(0, 3).map((member, idx) => {
                    console.log('멤버 데이터:', member); // 각 멤버 데이터 확인
                    return (
                        <div key={idx} className="ranking-item-small">
                            {/* 사용자 이름 */}
                            <span 
                                className="member-name clickable-member" 
                                onClick={() => handleUserClick(member.id)}
                            >
                                {member.id}
                            </span>
                            
                            {/* 레벨 정보 (이름 + 아이콘) */}
                            <div className="level-group">
                                <span className="level-name">{member.lv_name}</span>
                                {member.lv_icon && (
                                    <img
                                        src={member.lv_icon}
                                        alt="레벨 아이콘"
                                        className="main-level-icon"
                                    />
                                )}
                            </div>
                            
                            {/* 승급 날짜 - lv_date 필드 사용 */}
                            <span className="upgrade-date">{formatDate(member.lv_date)}</span>
                        </div>
                    );
                })
            ) : (
                <p>랭킹 정보가 없습니다.</p>
            )}
        </div>
    );
} 