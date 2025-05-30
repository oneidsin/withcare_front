import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RecentSearches.css';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: 'http://localhost',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

const RecentSearches = ({ onSearchClick }) => {
    const [searchTerms, setSearchTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 인기 검색어 더미 데이터 (인기 검색어 API 실패 시 폴백으로 사용)
    const popularSearchTerms = [
        { sch_keyword: "자유게시판" },
        { sch_keyword: "공지사항" },
        { sch_keyword: "게시판" },
        { sch_keyword: "질문" },
        { sch_keyword: "추천" }
    ];

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        setIsLoggedIn(!!token);
        
        if (token) {
            fetchUserSearchTerms();
        } else {
            fetchPopularSearchTerms();
        }
        
        // 1분마다 검색어 목록 갱신 (로그인한 경우에만)
        let interval;
        if (token) {
            interval = setInterval(fetchUserSearchTerms, 60000);
        } else {
            interval = setInterval(fetchPopularSearchTerms, 60000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    // 인기 검색어 가져오기 (비로그인 사용자용)
    const fetchPopularSearchTerms = async () => {
        try {
            setLoading(true);
            
            // 백엔드에 인기 검색어 API가 있다면 호출
            try {
                const response = await api.get('/search/popular');
                
                if (response.data && response.data.success) {
                    setSearchTerms(response.data.data || []);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.log('인기 검색어 API 호출 실패, 기본값 사용:', err);
            }
            
            // API 실패 시 더미 데이터 사용
            setSearchTerms(popularSearchTerms);
            setLoading(false);
        } catch (err) {
            console.error('검색어 로딩 실패:', err);
            setSearchTerms(popularSearchTerms);
            setLoading(false);
        }
    };

    const fetchUserSearchTerms = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            // 토큰에서 사용자 ID 추출
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            const userId = payload.id;

            const response = await api.get(`/search/recent/${userId}`, {
                headers: {
                    'Authorization': token
                }
            });

            if (response.data.success) {
                // 최신순으로 정렬 후 상위 5개만 표시
                const validSearchTerms = response.data.data
                    .slice(0, 5); // 상위 5개만 표시
                
                setSearchTerms(validSearchTerms);
            } else {
                console.warn('검색어 로딩 실패:', response.data.message);
            }
        } catch (err) {
            console.error('검색어 로딩 실패:', err);
            setError('최근 검색어를 불러오는데 실패했습니다.');
            // 로그인 페이지로 리다이렉트하지 않음
        } finally {
            setLoading(false);
        }
    };

    // 검색어 클릭 핸들러
    const handleSearchTermClick = (keyword) => {
        if (onSearchClick && typeof onSearchClick === 'function') {
            onSearchClick(keyword);
        }
    };

    if (loading) {
        return <div className="recent-searches">로딩 중...</div>;
    }

    if (error) {
        return <div className="recent-searches error">{error}</div>;
    }

    return (
        <div className="recent-searches">
            <h3>{isLoggedIn ? "최근 검색어" : "인기 검색어"}</h3>
            <div className="search-terms">
                {searchTerms.length === 0 ? (
                    <p>{isLoggedIn ? "검색 기록이 없습니다." : "인기 검색어가 없습니다."}</p>
                ) : (
                    searchTerms.map((item, index) => (
                        <span 
                            key={index} 
                            className={`search-term ${!isLoggedIn && index < 3 ? 'popular-term' : ''}`}
                            onClick={() => handleSearchTermClick(item.sch_keyword)}
                            title={item.sch_keyword}
                        >
                            {!isLoggedIn && index < 3 && <span className="rank">{index + 1}</span>}
                            {item.sch_keyword}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentSearches; 