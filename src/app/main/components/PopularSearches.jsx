import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function PopularSearches() {
    const [popularSearches, setPopularSearches] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadPopularSearches();
    }, []);

    // 인기 검색어 로드 함수
    const loadPopularSearches = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost/search/popular');
            console.log('인기 검색어 원본 데이터:', response.data);
            
            if (response.data && response.data.success) {
                const cleanedData = processSearchKeywords(response.data.data || []);
                console.log('정제된 인기 검색어 데이터:', cleanedData);
                setPopularSearches(cleanedData);
            } else {
                console.warn('인기 검색어 API 응답 실패:', response.data);
                setPopularSearches([]);
            }
        } catch (err) {
            console.error('인기 검색어 로딩 실패:', err);
            setPopularSearches([]);
        } finally {
            setLoading(false);
        }
    };

    // 인기 검색어 데이터 정제 함수
    const processSearchKeywords = (keywords) => {
        if (!Array.isArray(keywords) || keywords.length === 0) {
            console.warn('유효한 키워드 데이터가 없습니다:', keywords);
            return [];
        }

        console.log('원본 키워드 형식:', keywords[0]);

        // 데이터 구조에 따라 처리 방식 변경
        const processedKeywords = keywords.map(item => {
            // 항목이 객체가 아니거나 sch_keyword가 없는 경우 처리
            if (typeof item !== 'object') {
                return { sch_keyword: String(item).trim() };
            }
            
            // sch_keyword가 직접 속성인 경우
            if (item.sch_keyword !== undefined) {
                return {
                    ...item,
                    sch_keyword: String(item.sch_keyword).trim()
                };
            }
            
            // API가 { sch_keyword: '검색어' } 형태로 반환하지 않을 경우
            // 첫 번째 속성값을 검색어로 사용 (일반적으로 sch_keyword가 직접 값인 경우)
            const firstKey = Object.keys(item)[0];
            return {
                sch_keyword: String(item[firstKey] || '').trim()
            };
        });

        // 빈 검색어 필터링
        const filteredKeywords = processedKeywords.filter(item => 
            item.sch_keyword && item.sch_keyword.trim() !== ''
        );

        // 중복 제거 (같은 검색어는 하나만 남김)
        const uniqueKeywords = [];
        const keywordSet = new Set();
        
        filteredKeywords.forEach(item => {
            const keyword = item.sch_keyword.trim();
            if (!keywordSet.has(keyword)) {
                keywordSet.add(keyword);
                uniqueKeywords.push({
                    ...item,
                    sch_keyword: keyword // 앞뒤 공백 제거
                });
            }
        });

        // 검색 횟수 또는 우선순위별로 정렬
        // 이미 인기순으로 정렬되어 왔으므로 배열 순서 유지
        return uniqueKeywords.slice(0, 5); // 상위 5개만 반환
    };

    // 인기 검색어 클릭 시 검색 페이지로 이동
    const handleSearchClick = (keyword) => {
        // sessionStorage에 검색어 저장 (검색 페이지에서 사용하기 위함)
        sessionStorage.setItem('tempSearchKeyword', keyword);
        router.push('/search');
    };

    return (
        <div className="card small-card">
            <h2>인기 검색어</h2>
            <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
            {loading ? (
                <p>로딩 중...</p>
            ) : (
                <div className="popular-searches-container">
                    {popularSearches.length > 0 ? (
                        popularSearches.map((item, idx) => (
                            <p 
                                key={idx} 
                                className="popular-search-item"
                                onClick={() => handleSearchClick(item.sch_keyword)}
                            >
                                <span className="search-rank">{idx + 1}.</span> {item.sch_keyword}
                            </p>
                        ))
                    ) : (
                        <p>인기 검색어가 없습니다.</p>
                    )}
                </div>
            )}
        </div>
    );
} 