"use client";

import React, {useState} from "react";
import './search.css'
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function SearchPage() {

    const [sortOption, setSortOption] = useState("latest");

    return (
        <div className="search-page">
            <div className="search-bar">
                <select>
                    <option value="">게시판 종류</option>
                    {/* 다른 게시판들 */}

                </select>
                <input type="text" placeholder="찾기 검색어" />
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
            <div className="sort-box">
                <label htmlFor="sort">정렬순</label>
                <select
                    id="sort"
                    name="sort"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}>
                    <option value="latest">최신순</option>
                    <option value="popular">인기순</option>
                </select>
            </div>

            {/* 게시판 리스트 */}
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
                    {/* 📌 TODO: 게시글 API 연동 후 아래 map 렌더링 예정
                      posts.map((post, index) => (
                        <tr key={post.id}>
                          <td>{post.id}</td>
                          <td>{post.title}</td>
                          <td>{post.writer}</td>
                          <td>{post.viewCount}</td>
                          <td>{post.likeCount}</td>
                          <td>{post.createdAt}</td>
                        </tr>
                      ))
                   */}
                </tbody>
            </table>
        </div>
    );
}