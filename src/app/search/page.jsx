"use client";

import React, {useEffect, useState} from "react";
import './search.css'
import SidebarLayout from '@/components/layout/SidebarLayout';
import axios from "axios";

export default function SearchPage() {

    // 게시글
    const [posts, setPosts] = useState([]);
    const [boards, setBoards] = useState([]);
    const [boardIdx, setBoardIdx] = useState(null);
    const [sortOption, setSortOption] = useState("latest");
    const [searchType, setSearchType] = useState("");
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);

    // 게시판 리스트 불러오기
    useEffect(() => {
        axios.get("http://localhost/board/list")
            .then(res => {
                const visibleBoards = res.data.filter(b => !b.blind_yn);
                setBoards(visibleBoards);
                if (visibleBoards.length > 0) {
                    setBoardIdx(visibleBoards[0].board_idx); // ✅ 수정!
                }
            });
    }, []);

// 게시글 소트 기준
    const sortedPosts = [...posts].sort((a, b) => {
        if (sortOption === "popular") {
            return (b.likes || 0) - (a.likes || 0);
        } else {
            return new Date(b.post.post_create_date || 0) - new Date(a.post.post_create_date || 0);
        }
    });

// 게시글 리스트 불러오기
    useEffect(() => {
        if (!boardIdx) return;

        fetchPosts(page, boardIdx, sortOption, searchType, keyword)
            .then(res => {
                if (res.data.success) {
                    setPosts(res.data.posts);
                } else {
                    alert(res.data.message);
                }
            })
            .catch(err => {
                console.error("게시글 로딩 실패", err);
            });
    }, [page, boardIdx, sortOption, searchType, keyword]);

// API 호출 함수 정의
    const fetchPosts = async (page, boardIdx, sortOption, searchType, keyword) => {
        return axios.get(`http://localhost/post/list/${page}`, {
            params: {
                board_idx: boardIdx,
                sort: sortOption,
                searchType: searchType || null,
                keyword: keyword || null,
            },
            headers: {
                Authorization: localStorage.getItem("token") || ""
            }
        });
    };

    return (
        <div className="search-page">
            <div className="search-bar">
                <select>
                    <option value="">게시판 종류</option>
                    {/* 게시판 리스트 */}
                    {boards.map((board) => (
                        <option key={board.board_idx} value={board.board_idx}>
                            {board.board_name}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="찾기 검색어"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}/>
                <button>🔍</button>
            </div>

            {/* 최근 검색어 */}
            <div className="recent-keywords">
                <h3>최근 검색어</h3>
                <div className="tags">
                    <span className="tag">항암 치료 부작용</span>
                    <span className="tag">면역 항암제</span>
                    {/* ... */}
                </div>
            </div>

            {/* 인기 검색어 */}
            <div className="popular-keywords">
                <h3>인기 검색어</h3>
                <div className="tags">
                    <span className="tag">간암</span>
                    <span className="tag">췌장암</span>
                    {/* ... */}
                </div>
            </div>

            {/* 정렬 옵션 */}
                <div className="sort-box" style={{ marginBottom: "15px" }}>
                    <label htmlFor="sort" style={{ marginRight: "8px" }}>정렬순</label>
                    <select
                        id="sort"
                        name="sort"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                    >
                        <option value="latest">최신순</option>
                        <option value="popular">인기순</option>
                    </select>
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
                {sortedPosts.map(item => (
                    <tr
                        key={item.post.post_idx}
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
                ))}
                </tbody>
                <tbody>
                {posts.length === 0 ? (
                    <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>게시글이 없습니다.</td>
                    </tr>
                ) : (
                    posts.map(item => (
                        <tr key={item.post.post_idx}>
                    </tr>
                    ))
                    )}
                </tbody>
            </table>
        </div>
    );
}