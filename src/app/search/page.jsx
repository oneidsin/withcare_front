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
    }
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

    // 검색 내 게시판 리스트 불러오기...
    useEffect(() => {
        axios.get("http://localhost/board/list")
            .then(res => {
                const visibleBoards = res.data.filter(b => !b.blind_yn);
                setBoards(visibleBoards);
                if (res.data.length > 0) {
                    setBoardIdx(res.data[0].board_idx);
                }
            })
            .catch(error => {
                console.error("게시판 목록 로딩 실패", error);
            });
    }, []);

    // 게시글 리스트 불러오기
    useEffect(() => {
        if (!boardIdx) return;

        fetchPosts(page, boardIdx, sortOption, searchType, keyword)
            .then(res => {
                console.log('게시글 응답:', res.data);
                if (res.data.success) {
                    setPosts(res.data.list || []);
                    setTotalPages(res.data.totalPages || 1);
                } else {
                    alert(res.data.message);
                    setPosts([]);
                }
            })
            .catch(err => {
                console.error("게시글 로딩 실패", err);
                setPosts([]);
            });
    }, [page, boardIdx, sortOption, searchType, keyword]);

    // 검색어 유효성 검사
    const validateSearchKeyword = (keyword) => {
        if (!keyword || keyword.trim().length < SEARCH_CONSTANTS.MIN_LENGTH) {
            alert('검색어를 입력해주세요.');
            return false;
        }
        
        if (keyword.trim().length > SEARCH_CONSTANTS.MAX_LENGTH) {
            alert(`검색어는 ${SEARCH_CONSTANTS.MAX_LENGTH}자 이내로 입력해주세요.`);
            return false;
        }

        return true;
    };

    // 검색어 저장 함수
    const saveSearchTerm = async (searchKeyword, searchType, boardIdx) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                console.log('비로그인 상태: 검색어 저장 건너뜀');
                return;
            }

            if (!validateSearchKeyword(searchKeyword)) {
                return;
            }

            if (!boardIdx) {
                console.log('게시판이 선택되지 않음: 검색어 저장 건너뜀');
                return;
            }

            const requestData = {
                sch_keyword: searchKeyword.trim(),
                sch_type: SEARCH_CONSTANTS.TYPE_MAP[searchType],
                board_idx: parseInt(boardIdx)
            };

            console.log('검색어 저장 요청:', requestData);

            const response = await api.post('/search', requestData, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            console.log('검색어 저장 응답:', response);
            
            if (!response.data.success) {
                throw new Error(response.data.message || '검색어 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('검색어 저장 실패:', error);
            if (error.response) {
                console.error('서버 응답:', error.response.data);
                throw new Error(error.response.data.message || '검색어 저장에 실패했습니다.');
            } else if (error.request) {
                console.error('서버 요청 실패:', error.request);
                throw new Error('서버와 통신할 수 없습니다.');
            } else {
                throw error;
            }
        }
    };

    // 검색어 클릭 핸들러
    const handleSearchTermClick = (searchKeyword) => {
        console.log('검색어 클릭:', searchKeyword);
        setKeyword(searchKeyword);
        setPage(1);
        handleSearch(null, searchKeyword); // 검색 실행
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
            boardIdx,
            sortOption,
            page: 1
        });

        setPage(1);
        
        try {
            // 검색어 저장
            try {
                await saveSearchTerm(keywordToSearch, searchType, boardIdx);
                console.log('검색어 저장 성공');
            } catch (saveError) {
                console.error('검색어 저장 중 오류:', saveError);
                // 검색어 저장 실패해도 검색은 계속 진행
            }

            // 검색 실행
            const res = await fetchPosts(1, boardIdx, sortOption, searchType, keywordToSearch.trim());
            console.log('검색 결과:', res.data);
            
            if (res.data.success) {
                setPosts(res.data.list || []);
                setTotalPages(res.data.totalPages || 1);
            } else {
                alert(res.data.message || '검색 결과를 가져오는데 실패했습니다.');
                setPosts([]);
            }
        } catch (err) {
            console.error("검색 실패", err);
            alert(err.message || "검색 중 오류가 발생했습니다.");
            setPosts([]);
        }
    };

    // API 호출 함수 정의
    const fetchPosts = async (page, boardIdx, sortOption, searchType, keyword) => {
        const token = sessionStorage.getItem("token");
        return axios.get(`http://localhost/post/list/${page}`, {
            params: {
                board_idx: boardIdx,
                sort: sortOption,
                searchType: SEARCH_CONSTANTS.TYPE_MAP[searchType],
                keyword: keyword || null,
            },
            headers: {
                Authorization: token || ""
            }
        });
    };

    // 게시판 변경 처리
    const handleBoardChange = (selectedBoardIdx) => {
        setBoardIdx(selectedBoardIdx);
        setPage(1); // 게시판 변경 시 첫 페이지로 이동
    };

    // 게시글 소트 기준
    const sortedPosts = [...posts].sort((a, b) => {
        if (sortOption === "popular") {
            return (b.likes || 0) - (a.likes || 0);
        } else {
            return new Date(b.post.post_create_date) - new Date(a.post.post_create_date);
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
                        onChange={(e) => setKeyword(e.target.value)}
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
                        sortedPosts.map(item => (
                            <tr
                                key={`${item.post.board_idx}-${item.post.post_idx}`}
                                onClick={() => router.push(`/post/detail?post_idx=${item.post.post_idx}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{item.post.post_idx}</td>
                                <td>
                                    {item.post.post_blind_yn && "🔒 "}
                                    {item.post.post_title}
                                    {item.post.com_yn && <span> 🖼</span>}
                                </td>
                                <td>{item.writer || item.nickname || "익명"}</td>
                                <td>{item.post.post_view_cnt}</td>
                                <td>{item.likes || 0}</td>
                                <td>{item.post.post_create_date?.slice(0, 10)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={page === p ? 'active' : ''}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}