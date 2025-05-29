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

// 검색어 유효성 검사 함수
const isValidSearchTerm = (term) => {
    if (!term) return false;
    if (term.trim().length === 0) return false;
    const koreanConsonantVowel = /^[ㄱ-ㅎㅏ-ㅣ]+$/;
    if (koreanConsonantVowel.test(term)) return false;
    const specialChars = /^[!@#$%^&*(),.?":{}|<>]+$/;
    if (specialChars.test(term)) return false;
    return true;
};

const RecentSearches = () => {
    const [searchTerms, setSearchTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSearchTerms();
        // 1분마다 검색어 목록 갱신
        const interval = setInterval(fetchSearchTerms, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchSearchTerms = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                console.log('토큰이 없습니다.');
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
                // 검색어 빈도수 계산 및 정렬 (유효한 검색어만)
                const frequencyMap = response.data.data.reduce((acc, item) => {
                    const keyword = item.sch_keyword;
                    if (isValidSearchTerm(keyword)) {
                        acc[keyword] = (acc[keyword] || 0) + 1;
                    }
                    return acc;
                }, {});

                // 빈도수 기준으로 정렬된 검색어 배열 생성
                const sortedTerms = Object.entries(frequencyMap)
                    .sort(([, a], [, b]) => b - a)
                    .map(([keyword]) => keyword)
                    .slice(0, 10); // 상위 10개만 표시

                setSearchTerms(sortedTerms);
            } else {
                console.warn('검색어 로딩 실패:', response.data.message);
            }
        } catch (err) {
            console.error('검색어 로딩 실패:', err);
            setError('최근 검색어를 불러오는데 실패했습니다.');
            
            if (err.response && err.response.status === 401) {
                window.location.href = '/login';
                return;
            }
        } finally {
            setLoading(false);
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
            <h3>인기 검색어</h3>
            <div className="search-terms">
                {searchTerms.length === 0 ? (
                    <p>검색어가 없습니다.</p>
                ) : (
                    searchTerms.map((term, index) => (
                        <span key={index} className="search-term">
                            {term}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentSearches; 