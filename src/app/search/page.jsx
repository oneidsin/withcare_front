"use client";

import React, {useEffect, useState, useCallback} from "react";
import './search.css'
import SidebarLayout from '@/components/layout/SidebarLayout';
import RecentSearches from './components/RecentSearches';
import { UserWithIcons } from '@/components/UserIcons';
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

// offset 계산 함수 추가
const calculateOffset = (page, pageSize) => {
    return (page - 1) * pageSize;
};

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
    const [isAnonymousBoard, setIsAnonymousBoard] = useState(false);
    const [refreshRecentSearches, setRefreshRecentSearches] = useState(null);
    const [addSearchTermImmediately, setAddSearchTermImmediately] = useState(null);

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

    // 메인 페이지에서 인기 검색어 클릭 시 검색 수행
    useEffect(() => {
        const tempSearchKeyword = sessionStorage.getItem('tempSearchKeyword');
        if (tempSearchKeyword && boardIdx) {
            setKeyword(tempSearchKeyword);
            // 검색 수행
            handleSearch(null, tempSearchKeyword, 1);
            // 사용 후 제거
            sessionStorage.removeItem('tempSearchKeyword');
        }
    }, [boardIdx]); // boardIdx가 설정된 후에 실행

    // 초기 게시글 목록 불러오기 함수
    const loadInitialPosts = async (selectedBoardIdx, pageNum = 1) => {
        try {
            const token = sessionStorage.getItem('token');
            
            console.log('초기 게시글 로딩 요청:', {
                board_idx: selectedBoardIdx,
                page: pageNum,
                pageSize: SEARCH_CONSTANTS.PAGE_SIZE,
                offset: calculateOffset(pageNum, SEARCH_CONSTANTS.PAGE_SIZE),
                isNewBoard: pageNum === 1
            });

            const requestData = {
                board_idx: selectedBoardIdx,
                page: pageNum,
                pageSize: SEARCH_CONSTANTS.PAGE_SIZE,
                offset: calculateOffset(pageNum, SEARCH_CONSTANTS.PAGE_SIZE),
                sch_type: SEARCH_CONSTANTS.TYPE_MAP[searchType],
                sch_keyword: '' // 게시판 변경 시에는 검색어 없이 전체 목록 로딩
            };

            console.log('API 요청 데이터:', requestData);
            
            // API 요청 헤더 설정 (토큰이 있는 경우에만 포함)
            const headers = {};
            if (token) {
                headers['Authorization'] = token;
            }

            try {
                const res = await api.post('/search', requestData, {
                    headers: headers,
                    timeout: 5000 // 5초 타임아웃 설정
                });

                console.log('초기 게시글 로딩 응답:', res.data);

                if (!res.data.success) {
                    if (res.data.redirect) {
                        console.warn('리다이렉트 요청이 있지만 무시합니다:', res.data.redirect);
                    }
                    console.warn('API 응답 실패:', res.data.message);
                    // 실패해도 빈 배열 설정
                    setPosts([]);
                    setTotalPages(1);
                    setPage(pageNum);
                    return;
                }

                const postData = res.data.data || [];
                const totalPagesFromAPI = res.data.totalPages || 1;
                const totalCountFromAPI = res.data.totalCount || 0;

                console.log(`게시판 ${selectedBoardIdx} 로딩 완료:`, {
                    게시글수: postData.length,
                    총페이지: totalPagesFromAPI,
                    총게시글수: totalCountFromAPI,
                    현재페이지: pageNum
                });

                setPosts(postData);
                setTotalPages(totalPagesFromAPI);
                setPage(pageNum);

            } catch (err) {
                console.error("초기 게시글 로딩 실패", err);
                setPosts([]);
                setTotalPages(1);
                setPage(1);
            }
        } catch (outerErr) {
            console.error("치명적인 오류 발생", outerErr);
            setPosts([]);
            setTotalPages(1);
            setPage(1);
        }
    };

    // 검색어 입력 핸들러
    const handleKeywordChange = (e) => {
        const newKeyword = e.target.value;
        setKeyword(newKeyword);
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
        
        // 검색 수행 (최근 검색어 새로고침 포함)
        handleSearchInternal(searchKeyword, 1, true);
    };

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

    // 최근 검색어 즉시 업데이트 함수
    const updateSearchTermsImmediately = (keyword) => {
        if (keyword && keyword.trim().length > 0) {
            console.log('검색어 즉시 업데이트 시도:', keyword);
            
            // 1. 먼저 로컬 상태에 즉시 추가
            if (addSearchTermImmediately) {
                addSearchTermImmediately(keyword);
            }
            
            // 2. API로 새로고침 (백엔드와 동기화)
            if (refreshRecentSearches) {
                setTimeout(() => {
                    console.log('검색어 API 새로고침 실행:', keyword);
                    refreshRecentSearches();
                }, 200);
            }
        }
    };

    // 내부 검색 처리 함수 (검색어 저장 후 새로고침 여부 제어 가능)
    const handleSearchInternal = async (searchKeyword, pageNum = 1, shouldRefreshSearchTerms = true) => {
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
            page: pageNum,
            offset: calculateOffset(pageNum, SEARCH_CONSTANTS.PAGE_SIZE)
        });

        try {
            const token = sessionStorage.getItem('token');
            
            // API 요청 헤더 설정 (토큰이 있는 경우에만 포함)
            const headers = {};
            if (token) {
                headers['Authorization'] = token;
            }

            try {
                const res = await api.post('/search', {
                    sch_keyword: keywordToSearch.trim(),
                    sch_type: SEARCH_CONSTANTS.TYPE_MAP[searchType],
                    board_idx: boardIdx,
                    page: pageNum,
                    pageSize: SEARCH_CONSTANTS.PAGE_SIZE,
                    offset: calculateOffset(pageNum, SEARCH_CONSTANTS.PAGE_SIZE)
                }, {
                    headers: headers,
                    timeout: 5000 // 5초 타임아웃 설정
                });

                console.log('검색 결과:', res.data);
                
                if (!res.data.success) {
                    if (res.data.redirect) {
                        console.warn('리다이렉트 요청이 있지만 무시합니다:', res.data.redirect);
                    }
                    console.warn('API 검색 응답 실패:', res.data.message);
                    // 실패해도 기존 게시글 유지
                    return;
                }

                setPosts(res.data.data || []);
                setTotalPages(res.data.totalPages || 1);
                setPage(pageNum); // 검색 시 현재 페이지 업데이트
                
                // 검색 성공 후 검색어가 있고 첫 페이지이며 새로고침해야 하는 경우 최근 검색어 즉시 업데이트
                if (shouldRefreshSearchTerms && pageNum === 1) {
                    updateSearchTermsImmediately(keywordToSearch);
                }
                
            } catch (err) {
                console.error("검색 요청 실패", err);
                // 에러 발생해도 기존 게시글 유지
            }
        } catch (outerErr) {
            console.error("치명적인 검색 오류", outerErr);
        }
    };

    // 검색 처리 함수 (폼 제출용)
    const handleSearch = async (e, searchKeyword = null, pageNum = 1) => {
        if (e) {
            e.preventDefault();
        }
        
        await handleSearchInternal(searchKeyword, pageNum, true);
    };

    // 페이지 변경 핸들러
    const handlePageChange = async (newPage) => {
        if (newPage === page || newPage < 1 || newPage > totalPages) return; // 유효하지 않은 페이지면 무시
        
        console.log('페이지 변경:', {
            currentPage: page,
            newPage: newPage,
            keyword: keyword,
            boardIdx: boardIdx,
            totalPages: totalPages
        });

        if (!boardIdx) {
            alert('게시판을 선택해주세요.');
            return;
        }

        // 검색어가 있으면 검색으로, 없으면 게시글 목록으로
        if (keyword && keyword.trim().length > 0) {
            // 검색 상태에서 페이지 변경 - 검색어 저장하지 않음
            await handleSearchInternal(keyword, newPage, false);
        } else {
            // 일반 게시글 목록에서 페이지 변경
            await loadInitialPosts(boardIdx, newPage);
        }
    };

    // 게시판 변경 처리
    const handleBoardChange = async (selectedBoardIdx) => {
        console.log('게시판 변경:', {
            selectedBoardIdx,
            currentKeyword: keyword,
            currentSearchType: searchType
        });

        if (!selectedBoardIdx) {
            setPosts([]);
            setBoardIdx(null);
            setIsAnonymousBoard(false);
            setTotalPages(1);
            setPage(1);
            return;
        }

        // 선택된 게시판 정보 찾기
        const selectedBoard = boards.find(board => board.board_idx == selectedBoardIdx);
        if (selectedBoard) {
            setIsAnonymousBoard(selectedBoard.anony_yn === true);
            console.log(`게시판 변경: ${selectedBoard.board_name} (익명: ${selectedBoard.anony_yn})`);
        }

        // 문자열을 숫자로 변환
        const boardIdxNum = parseInt(selectedBoardIdx);
        setBoardIdx(boardIdxNum);
        setPage(1); // 페이지를 1로 초기화
        setTotalPages(1); // 총 페이지도 초기화
        setKeyword(''); // 검색어도 초기화

        // 게시판 변경 시 해당 게시판의 게시글 목록 불러오기
        console.log('게시판 변경 후 게시글 로딩 시작...');
        await loadInitialPosts(boardIdxNum, 1);
    };

    // 게시글 정렬 처리
    const sortedPosts = [...posts].sort((a, b) => {
        if (sortOption === "popular") {
            return (b.like_count || 0) - (a.like_count || 0);
        } else {
            return new Date(b.created_date) - new Date(a.created_date);
        }
    });

    // 게시글 행 렌더링
    const renderPostRow = (post) => {
        return (
            <tr
                key={post.post_idx}
                onClick={() => {
                    router.push(`/post/detail?post_idx=${post.post_idx}&board_idx=${post.board_idx}`);
                }}
                style={{ cursor: "pointer" }}
            >
                <td>{post.post_idx}</td>
                <td>
                    {post.title}
                </td>
                <td>
                    <UserWithIcons 
                        userId={post.writer} 
                        isAnonymousBoard={isAnonymousBoard}
                        onClick={(userId) => router.push(`/profile/view/${userId}`)}
                    />
                </td>
                <td>{post.post_view_cnt || 0}</td>
                <td>{post.like_count || 0}</td>
                <td>{post.created_date?.slice(0, 10)}</td>
            </tr>
        );
    };

    return (
        <div className="sch-page">
            <div className="sch-bar">
                {/* 게시판 선택 */}
                <select 
                    value={boardIdx || ''} 
                    onChange={(e) => handleBoardChange(e.target.value)}
                    className="sch-board-select"
                >
                    <option value="">게시판 선택</option>
                    {boards.map(board => (
                        <option key={board.board_idx} value={board.board_idx}>
                            {board.board_name}
                        </option>
                    ))}
                </select>

                {/* 정렬 옵션 */}
                <div className="sch-sort-box">
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="sch-sort-select"
                    >
                        <option value="latest">최신순</option>
                        <option value="popular">추천순</option>
                    </select>
                </div>

                {/* 검색 폼 */}
                <form onSubmit={handleSearch} className="sch-form">
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
                    <button type="submit" className="sch-button">검색</button>
                </form>
            </div>

            {/* 최신 검색어 컴포넌트 */}
            <RecentSearches 
                onSearchClick={handleSearchTermClick} 
                onRefresh={useCallback((refreshFn, addFn) => {
                    setRefreshRecentSearches(() => refreshFn);
                    setAddSearchTermImmediately(() => addFn);
                }, [])}
            />

            {/* 게시글 리스트 */}
            <table className="sch-post-table">
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
                            <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                                {boardIdx ? (
                                    keyword && keyword.trim().length > 0 ? 
                                    `'${keyword}' 검색 결과가 없습니다.` : 
                                    '게시글이 없습니다.'
                                ) : '게시판을 선택해주세요.'}
                            </td>
                        </tr>
                    ) : (
                        sortedPosts.map(post => renderPostRow(post))
                    )}
                </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 0 && (
                <div className="sch-pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
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
                <div className="page-info" style={{ textAlign: 'center', marginTop: '10px', color: '#6c757d' }}>
                    {page} / {totalPages} 페이지
                </div>
            )}
        </div>
    );
}