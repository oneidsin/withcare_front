import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RecentSearches.css';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: 'http://localhost:80',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 5000
});

// 요청 인터셉터 추가
api.interceptors.request.use(
    config => {
        console.log('Request Config:', {
            url: config.url,
            method: config.method,
            headers: config.headers,
            data: config.data
        });
        return config;
    },
    error => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터 추가
api.interceptors.response.use(
    response => {
        console.log('Response:', response);
        return response;
    },
    error => {
        console.error('Response Error:', error);
        return Promise.reject(error);
    }
);

const RecentSearches = ({ onSearchClick }) => {
    const [searchTerms, setSearchTerms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPopularSearchTerms = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                console.log('Fetching popular search terms...');
                const response = await api.get('/search/popular');
                console.log('Response:', response.data);

                if (response.data.success) {
                    // 데이터 구조에 맞게 변환
                    const terms = response.data.data.map(item => ({
                        keyword: item.sch_keyword,
                        count: item.count
                    }));
                    setSearchTerms(terms);
                } else {
                    setError(response.data.message || '인기 검색어를 불러오는데 실패했습니다.');
                }
            } catch (error) {
                console.error('인기 검색어 로딩 실패:', error);
                if (error.response) {
                    console.error('Error response:', error.response.data);
                    setError(error.response.data.message || '인기 검색어를 불러오는데 실패했습니다.');
                } else if (error.request) {
                    console.error('Error request:', error.request);
                    setError('서버와 통신할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
                } else {
                    console.error('Error config:', error.config);
                    setError('요청 처리 중 오류가 발생했습니다.');
                }
                setSearchTerms([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPopularSearchTerms();
    }, []);

    if (isLoading) {
        return (
            <div className="recent-searches">
                <h3>인기 검색어 로딩중...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div className="recent-searches">
                <h3>인기 검색어를 불러올 수 없습니다</h3>
                <p className="error-message">{error}</p>
                <button 
                    className="retry-button" 
                    onClick={() => window.location.reload()}
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="recent-searches">
            <h3>인기 검색어</h3>
            <div className="search-terms">
                {searchTerms.length === 0 ? (
                    <p className="no-terms">검색어가 없습니다.</p>
                ) : (
                    searchTerms.map((term, index) => (
                        <button
                            key={index}
                            className="search-term-tag"
                            onClick={() => onSearchClick(term.keyword)}
                        >
                            {term.keyword}
                            <span className="search-count">({term.count})</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentSearches; 