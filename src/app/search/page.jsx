"use client";

import React, {useEffect, useState} from "react";
import './search.css'
import SidebarLayout from '@/components/layout/SidebarLayout';
import axios from "axios";
import { useRouter } from 'next/navigation';

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

    // API 호출 함수 정의
    const fetchPosts = async (page, boardIdx, sortOption, searchType, keyword) => {
        const token = sessionStorage.getItem("token");
        return axios.get(`http://localhost/post/list/${page}`, {
            params: {
                board_idx: boardIdx,
                sort: sortOption,
                searchType: searchType || null,
                keyword: keyword || null,
            },
            headers: {
                Authorization: token || ""
            }
        });
    };

    // 검색 처리 함수
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // 검색 시 첫 페이지로 이동
        // useEffect의 의존성 배열에 의해 자동으로 검색 실행
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
                    <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                        <option key="title" value="title">제목</option>
                        <option key="content" value="content">내용</option>
                        <option key="title_content" value="title_content">제목+내용</option>
                        <option key="id" value="id">작성자</option>
                    </select>
                    <input
                        type="text"
                        placeholder="검색어 입력"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <button type="submit">🔍</button>
                </form>
            </div>

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