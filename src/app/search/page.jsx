"use client";

import React, {useEffect, useState} from "react";
import './search.css'
import SidebarLayout from '@/components/layout/SidebarLayout';
import RecentSearches from './components/RecentSearches';
import axios from "axios";
import { useRouter } from 'next/navigation';

// 검색 관련 상수
const SEARCH_CONSTANTS = {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50, // 데이터베이스 컬럼 길이에 따라 조정 필요
    TYPE_MAP: {
        title: '제목',
        content: '내용',
        title_content: '제목+내용',
        id: '작성자'
    },
    PAGE_SIZE: 10 // 페이지당 게시글 수 추가
};

// axios 인스턴스 생성
const api = axios.create({
    baseURL: 'http://localhost',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export default function SearchPage() {
    const router = useRouter();

    // 게시글
    const [posts, setPosts] = useState([]);
    const [boards, setBoards] = useState([]);
    const [boardIdx, setBoardIdx] = useState(null);
    const [sortOption, setSortOption] = useState("latest");
    const [searchType, setSearchType] = useState("title");
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTimer, setSearchTimer] = useState(null);

    // 게시판 목록 불러오기
    useEffect(() => {
        axios.get("http://localhost/board/list")
            .then(res => {
                const visibleBoards = res.data.filter(b => !b.blind_yn);
                setBoards(visibleBoards);
                if (res.data.length > 0) {
                    const firstBoardIdx = res.data[0].board_idx;
                    setBoardIdx(firstBoardIdx);
                    
                    // 첫 번째 게시판의 게시글 목록 불러오기
                    loadInitialPosts(firstBoardIdx);
                }
            })
            .catch(error => {
                console.error("게시판 목록 로딩 실패", error);
            });
    }, []);

    // 초기 게시글 목록 불러오기 함수
    const loadInitialPosts = async (selectedBoardIdx) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const res = await api.post('/search', {
                board_idx: selectedBoardIdx,
                page: 1,
                pageSize: SEARCH_CONSTANTS.PAGE_SIZE,
                sch_type: SEARCH_CONSTANTS.TYPE_MAP[searchType],
                sch_keyword: '' // 빈 검색어로 초기 목록 불러오기
            }, {
                headers: {
                    'Authorization': token
                }
            });

            if (!res.data.success) {
                if (res.data.redirect) {
                    window.location.href = res.data.redirect;
                    return;
                }
                console.error('초기 게시글 로딩 실패:', res.data.message);
                setPosts([]);
                return;
            }

            setPosts(res.data.data || []);
            setTotalPages(res.data.totalPages || 1);
            setPage(1); // 게시판 변경 시 페이지를 1로 초기화
        } catch (err) {
            console.error("초기 게시글 로딩 실패", err);
            setPosts([]);
            if (err.response && err.response.status === 401) {
                window.location.href = '/login';
            }
        }
    };

    // 검색어 입력 핸들러
    const handleKeywordChange = (e) => {
        const newKeyword = e.target.value;
        setKeyword(newKeyword);

        // 이전 타이머가 있다면 취소
        if (searchTimer) {
            clearTimeout(searchTimer);
        }

        // 새로운 타이머 설정 (300ms 후에 검색 실행)
        const timer = setTimeout(() => {
            if (newKeyword.trim().length >= SEARCH_CONSTANTS.MIN_LENGTH) {
                if (!boardIdx) {
                    alert('게시판을 선택해주세요.');
                    return;
                }
                handleSearch(null, newKeyword);
            } else if (newKeyword.trim().length === 0) {
                // 검색어가 비어있을 때 현재 선택된 게시판의 초기 게시글 목록 불러오기
                if (boardIdx) {
                    loadInitialPosts(boardIdx);
                }
            }
        }, 300);

        setSearchTimer(timer);
    };

    // 컴포넌트가 언마운트될 때 타이머 정리
    useEffect(() => {
        return () => {
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
        };
    }, [searchTimer]);

    // 검색어 유효성 검사
    const validateSearchKeyword = (keyword) => {
        // 검색어가 없는 경우는 유효한 것으로 처리 (초기 목록 보기 용도)
        if (!keyword || keyword.trim().length === 0) {
            return true;
        }
        
        if (keyword.trim().length < SEARCH_CONSTANTS.MIN_LENGTH) {
            alert('검색어를 입력해주세요.');
            return false;
        }
        
        if (keyword.trim().length > SEARCH_CONSTANTS.MAX_LENGTH) {
            alert(`검색어는 ${SEARCH_CONSTANTS.MAX_LENGTH}자 이내로 입력해주세요.`);
            return false;
        }

        return true;
    };

    // 검색어 클릭 핸들러
    const handleSearchTermClick = (searchKeyword) => {
        if (!boardIdx) {
            alert('게시판을 선택해주세요.');
            return;
        }
        console.log('검색어 클릭:', searchKeyword);
        setKeyword(searchKeyword);
        setPage(1);
        handleSearch(null, searchKeyword);
    };

    // 검색 처리 함수
    const handleSearch = async (e, searchKeyword = null) => {
        if (e) {
            e.preventDefault();
        }
        
        const keywordToSearch = searchKeyword || keyword;
        
        if (!validateSearchKeyword(keywordToSearch)) {
            return;
        }

        if (!boardIdx) {
            alert('게시판을 선택해주세요.');
            return;
        }

        console.log('검색 실행:', {
            keyword: keywordToSearch,
            searchType,
            mappedType: SEARCH_CONSTANTS.TYPE_MAP[searchType],
            boardIdx,
            sortOption,
            page
        });

        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const res = await api.post('/search', {
                sch_keyword: keywordToSearch.trim(),
                sch_type: SEARCH_CONSTANTS.TYPE_MAP[searchType],
                board_idx: boardIdx,
                page: page,
                pageSize: SEARCH_CONSTANTS.PAGE_SIZE
            }, {
                headers: {
                    'Authorization': token
                }
            });

            console.log('검색 결과:', res.data);
            
            if (!res.data.success) {
                if (res.data.redirect) {
                    window.location.href = res.data.redirect;
                    return;
                }
                alert(res.data.message || '검색 결과를 가져오는데 실패했습니다.');
                setPosts([]);
                return;
            }

            // 검색 결과가 현재 선택된 게시판의 것인지 확인
            const filteredPosts = res.data.data.filter(post => post.board_idx === parseInt(boardIdx));
            setPosts(filteredPosts || []);
            setTotalPages(Math.ceil(filteredPosts.length / SEARCH_CONSTANTS.PAGE_SIZE) || 1);
            
            if (res.data.searchSaved === false) {
                console.warn('검색어 저장에 실패했습니다.');
            }
        } catch (err) {
            console.error("검색 실패", err);
            alert(err.message || "검색 중 오류가 발생했습니다.");
            setPosts([]);
        }
    };

    // 페이지 변경 핸들러
    const handlePageChange = (newPage) => {
        if (newPage === page) return; // 같은 페이지면 무시
        
        setPage(newPage);
        
        // 검색어가 있는 경우와 없는 경우를 구분하여 처리
        if (keyword && keyword.trim()) {
            handleSearch(null, keyword);
        } else {
            // 검색어가 없는 경우 일반 게시글 목록 조회
            loadBoardPosts(newPage);
        }
    };

    // 일반 게시글 목록 조회
    const loadBoardPosts = async (pageNum) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const res = await api.post('/search', {
                board_idx: boardIdx,
                page: pageNum,
                pageSize: SEARCH_CONSTANTS.PAGE_SIZE,
                sch_type: SEARCH_CONSTANTS.TYPE_MAP[searchType],
                sch_keyword: '' // 빈 검색어로 초기 목록 불러오기
            }, {
                headers: {
                    'Authorization': token
                }
            });

            if (!res.data.success) {
                if (res.data.redirect) {
                    window.location.href = res.data.redirect;
                    return;
                }
                console.error('게시글 로딩 실패:', res.data.message);
                setPosts([]);
                return;
            }

            setPosts(res.data.data || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error("게시글 로딩 실패", err);
            setPosts([]);
            if (err.response && err.response.status === 401) {
                window.location.href = '/login';
            }
        }
    };

    // 게시판 변경 처리
    const handleBoardChange = (selectedBoardIdx) => {
        console.log('게시판 변경:', selectedBoardIdx);
        if (!selectedBoardIdx) {
            setPosts([]);
            setBoardIdx(null);
            return;
        }
        
        // 문자열을 숫자로 변환
        const boardIdxNum = parseInt(selectedBoardIdx);
        setBoardIdx(boardIdxNum);
        setPage(1);
        // 게시판 변경 시 해당 게시판의 게시글 목록 불러오기
        loadInitialPosts(boardIdxNum);
    };

    // 게시글 정렬 처리
    const sortedPosts = [...posts].sort((a, b) => {
        if (sortOption === "popular") {
            return (b.like_count || 0) - (a.like_count || 0);
        } else {
            return new Date(b.created_date) - new Date(a.created_date);
        }
    });

    return (
        <div className="search-page">
            <div className="search-bar">
                {/* 게시판 선택 */}
                <select 
                    value={boardIdx || ''} 
                    onChange={(e) => handleBoardChange(e.target.value)}
                    className="board-select"
                >
                    <option value="">게시판 선택</option>
                    {boards.map(board => (
                        <option key={board.board_idx} value={board.board_idx}>
                            {board.board_name}
                        </option>
                    ))}
                </select>

                {/* 정렬 옵션 */}
                <div className="sort-box">
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="sort-select"
                    >
                        <option value="latest">최신순</option>
                        <option value="popular">인기순</option>
                    </select>
                </div>

                {/* 검색 폼 */}
                <form onSubmit={handleSearch} className="search-form">
                    <select 
                        value={searchType} 
                        onChange={(e) => setSearchType(e.target.value)}
                    >
                        <option value="title">제목</option>
                        <option value="content">내용</option>
                        <option value="title_content">제목+내용</option>
                        <option value="id">작성자</option>
                    </select>
                    <input
                        type="text"
                        placeholder={`검색어 입력 (${SEARCH_CONSTANTS.MAX_LENGTH}자 이내)`}
                        value={keyword}
                        onChange={handleKeywordChange}
                        maxLength={SEARCH_CONSTANTS.MAX_LENGTH}
                    />
                    <button type="submit">🔍</button>
                </form>
            </div>

            {/* 인기 검색어 컴포넌트 */}
            <RecentSearches onSearchClick={handleSearchTermClick} />

            {/* 게시글 리스트 */}
            <table className="post-table">
                <thead>
                    <tr>
                        <th>글번호</th>
                        <th>제목</th>
                        <th>작성자</th>
                        <th>조회</th>
                        <th>추천</th>
                        <th>날짜</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center" }}>게시글이 없습니다.</td>
                        </tr>
                    ) : (
                        sortedPosts.map(post => (
                            <tr
                                key={post.post_idx}
                                onClick={() => {
                                    const token = sessionStorage.getItem('token');
                                    if (!token) {
                                        alert('로그인이 필요한 서비스입니다.');
                                        router.push('/login');
                                        return;
                                    }
                                    router.push(`/post/detail?post_idx=${post.post_idx}&board_idx=${post.board_idx}`);
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{post.post_idx}</td>
                                <td>
                                    {post.title}
                                </td>
                                <td>{post.writer || "익명"}</td>
                                <td>{post.post_view_cnt || 0}</td>
                                <td>{post.like_count || 0}</td>
                                <td>{post.created_date?.slice(0, 10)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 0 && (
                <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    {/* 첫 페이지로 이동 */}
                    {page > 1 && (
                        <button 
                            onClick={() => handlePageChange(1)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: '#fff'
                            }}
                        >
                            처음
                        </button>
                    )}
                    
                    {/* 이전 페이지 버튼 */}
                    {page > 1 && (
                        <button 
                            onClick={() => handlePageChange(page - 1)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: '#fff'
                            }}
                        >
                            이전
                        </button>
                    )}
                    
                    {/* 페이지 번호들 */}
                    {Array.from({ length: totalPages }, (_, i) => {
                        const pageNum = i + 1;
                        // 현재 페이지 주변 2개의 페이지만 표시
                        if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= page - 2 && pageNum <= page + 2)
                        ) {
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    style={{
                                        backgroundColor: page === pageNum ? '#007bff' : '#fff',
                                        color: page === pageNum ? '#fff' : '#000',
                                        border: '1px solid #dee2e6',
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        minWidth: '40px'
                                    }}
                                >
                                    {pageNum}
                                </button>
                            );
                        } else if (
                            (pageNum === page - 3 && pageNum > 1) || 
                            (pageNum === page + 3 && pageNum < totalPages)
                        ) {
                            return (
                                <span 
                                    key={pageNum} 
                                    style={{ 
                                        padding: '8px 4px',
                                        color: '#6c757d'
                                    }}
                                >
                                    ...
                                </span>
                            );
                        }
                        return null;
                    })}
                    
                    {/* 다음 페이지 버튼 */}
                    {page < totalPages && (
                        <button 
                            onClick={() => handlePageChange(page + 1)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: '#fff'
                            }}
                        >
                            다음
                        </button>
                    )}

                    {/* 마지막 페이지로 이동 */}
                    {page < totalPages && (
                        <button 
                            onClick={() => handlePageChange(totalPages)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: '#fff'
                            }}
                        >
                            마지막
                        </button>
                    )}
                </div>
            )}

            {/* 페이지 정보 표시 */}
            {totalPages > 0 && (
                <div className="page-info" style={{ textAlign: 'center', marginTop: '10px' }}>
                    {page} / {totalPages} 페이지
                </div>
            )}
        </div>
    );
}