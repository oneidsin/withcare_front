import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RecentSearches.css';

const RecentSearches = ({ onSearchClick }) => {
    const [searchTerms, setSearchTerms] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // 로그인 상태 확인
        const token = sessionStorage.getItem('token');
        setIsLoggedIn(!!token);

        // 검색어 가져오기
        const fetchSearchTerms = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const endpoint = isLoggedIn 
                    ? 'http://localhost/search/recent' // 로그인 사용자의 최근 검색어
                    : 'http://localhost/search/trending'; // 72시간 내 인기 검색어
                
                const response = await axios.get(endpoint, {
                    headers: token ? { Authorization: token } : {}
                });

                if (response.data.success) {
                    setSearchTerms(response.data.searchTerms || []);
                }
            } catch (error) {
                console.error('검색어 로딩 실패:', error);
            }
        };

        fetchSearchTerms();
    }, [isLoggedIn]);

    return (
        <div className="recent-searches">
            <h3>{isLoggedIn ? '최근 검색어' : '인기 검색어'}</h3>
            <div className="search-terms">
                {searchTerms.map((term, index) => (
                    <button
                        key={index}
                        className="search-term-tag"
                        onClick={() => onSearchClick(term.keyword)}
                    >
                        {term.keyword}
                        {!isLoggedIn && <span className="search-count">({term.count})</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RecentSearches; 