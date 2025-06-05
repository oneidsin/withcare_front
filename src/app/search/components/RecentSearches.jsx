import React, { useEffect, useState, useCallback } from 'react';
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

const RecentSearches = ({ onSearchClick, onRefresh }) => {
    const [searchTerms, setSearchTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // 강제 재렌더링용

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

    // 검색어를 즉시 로컬 상태에 추가하는 함수 (useCallback으로 메모화)
    const addSearchTermImmediately = useCallback((newKeyword) => {
        if (!newKeyword || newKeyword.trim().length === 0) return;
        
        console.log('검색어 즉시 추가:', newKeyword);
        
        const newSearchTerm = {
            sch_keyword: newKeyword.trim(),
            sch_create_date: new Date().toISOString()
        };
        
        setSearchTerms(prevTerms => {
            // 기존 검색어 중 같은 키워드가 있으면 제거
            const filteredTerms = prevTerms.filter(term => 
                term.sch_keyword !== newKeyword.trim()
            );
            
            // 새 검색어를 맨 앞에 추가하고 최대 5개까지만 유지
            const updatedTerms = [newSearchTerm, ...filteredTerms].slice(0, 5);
            console.log('즉시 업데이트된 검색어 목록:', updatedTerms);
            return updatedTerms;
        });
        
        // 강제 재렌더링
        setRefreshKey(prev => prev + 1);
    }, []);

    // 검색어 새로고침 함수 (useCallback으로 메모화)
    const refreshSearchTerms = useCallback(async () => {
        console.log('검색어 새로고침 함수 호출됨 - 시간:', new Date().toLocaleTimeString());
        const token = sessionStorage.getItem('token');
        
        // 강제 재렌더링
        setRefreshKey(prev => {
            const newKey = prev + 1;
            console.log('refreshKey 업데이트:', prev, '->', newKey);
            return newKey;
        });
        
        // 로딩 상태 설정
        setLoading(true);
        
        try {
            if (token) {
                await fetchUserSearchTerms();
            } else {
                await fetchPopularSearchTerms();
            }
        } catch (error) {
            console.error('검색어 새로고침 중 오류:', error);
        }
    }, []);

    // 외부에서 새로고침 요청 시 실행 (한 번만)
    useEffect(() => {
        if (onRefresh && typeof onRefresh === 'function') {
            // refreshSearchTerms와 함께 즉시 검색어 추가 함수도 전달
            onRefresh(refreshSearchTerms, addSearchTermImmediately);
        }
    }, []); // 빈 의존성 배열로 한 번만 실행



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
            console.log('사용자 검색어 가져오기 시작');
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

            console.log('사용자 ID:', userId, '으로 최근 검색어 요청');
            const response = await api.get(`/search/recent/${userId}`, {
                headers: {
                    'Authorization': token
                }
            });

            console.log('최근 검색어 API 응답:', response.data);

            if (response.data.success) {
                // 최신순으로 정렬 후 상위 5개만 표시
                const validSearchTerms = response.data.data
                    .slice(0, 5); // 상위 5개만 표시
                
                console.log('설정될 검색어들:', validSearchTerms);
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
        <div className="recent-searches" key={refreshKey}>
            <h3>{isLoggedIn ? "최근 검색어" : "인기 검색어"}</h3>
            <div className="search-terms">
                {searchTerms.length === 0 ? (
                    <p>{isLoggedIn ? "검색 기록이 없습니다." : "인기 검색어가 없습니다."}</p>
                ) : (
                    searchTerms.map((item, index) => (
                        <span 
                            key={`${refreshKey}-${index}`} 
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