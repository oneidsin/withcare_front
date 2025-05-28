'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import './post.css';

export default function PostPage() {
    // 게시글 리스트
    const searchParams = useSearchParams();
    const router = useRouter();
    const boardIdx = searchParams.get('board_idx') || '1';
    const [sort, setSort] = useState('latest');
    const [posts, setPosts] = useState([]);

    // 페이지
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 검색
    const [searchType, setSearchType] = useState('title');
    const [keyword, setKeyword] = useState('');

    // 열람 제한 레벨
    const [isAuthorized, setIsAuthorized] = useState(true);

    useEffect(() => {
        fetchPosts(boardIdx, page, sort, searchType, keyword);
    }, [boardIdx, page, sort]);

    useEffect(() => {
        if (keyword.trim() === '' && posts.length === 0) {
            fetchPosts(boardIdx, 1, sort, searchType, '');
            setPage(1);
        }
    }, [keyword]);

    const fetchPosts = async (boardIdx, page, sort, searchType = '', keyword = '') => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost/post/list/${page}`, {
                headers: { Authorization: token },
                params: { board_idx: boardIdx, sort, searchType, keyword }
            });

            if (res.data.success === false) {
                alert(res.data.message || '열람 권한이 없습니다.');
                setIsAuthorized(false);
                setPosts([]);
                setTotalPages(1);
                return; // 🔥 여기서 바로 return!
            }

            // 🔥 정상 접근
            setIsAuthorized(true);
            setPosts(res.data.list || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (e) {
            setIsAuthorized(false);
            alert("게시글 로딩 실패");
        }
    };

    return (
        <div className="post-page">
            {/* 🔥 조건부 렌더링: 글쓰기 버튼 */}
            {isAuthorized && (
                <div className="post-header">
                    <button className='write-button' onClick={() => router.push(`/post/write?board_idx=${boardIdx}`)}>
                        ✏ 글쓰기
                    </button>
                </div>
            )}

            {/* 🔥 조건부 렌더링: 게시글 테이블 */}
            {isAuthorized ? (
                <>
                    <table className="post-table">
                        <thead>
                        <tr>
                            <th>글번호</th>
                            <th>제목</th>
                            <th>조회</th>
                            <th>추천</th>
                            <th>날짜</th>
                        </tr>
                        </thead>
                        <tbody>
                        {posts.map((item) => (
                            <tr key={`${item.post.board_idx}-${item.post.post_idx}`} onClick={() => router.push(`/post/detail?post_idx=${item.post.post_idx}`)} style={{ cursor: 'pointer' }}>
                                <td>{item.post.post_idx}</td>
                                <td>
                                    {item.post.post_blind_yn && '🔒 '}
                                    {item.post.post_title}
                                    {item.post.com_yn && <span> 🖼</span>}
                                </td>
                                <td>{item.post.post_view_cnt}</td>
                                <td>{item.likes || 0}</td>
                                <td>{item.post.post_create_date?.slice(0, 10)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* 🔥 페이지네이션 */}
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

                    {/* 🔥 검색폼 */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setPage(1);
                            fetchPosts(boardIdx, 1, sort, searchType, keyword);
                            setKeyword('');
                        }}
                        className="search-form"
                    >
                        <select value={sort} onChange={e => setSort(e.target.value)}>
                            <option value="latest">최신순</option>
                            <option value="recommend">인기순</option>
                        </select>
                        <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                            <option value="title">제목</option>
                            <option value="content">내용</option>
                            <option value="title_content">제목+내용</option>
                            <option value="id">작성자</option>
                        </select>
                        <input
                            type="text"
                            placeholder="검색어 입력"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <button type="submit">검색</button>
                    </form>
                </>
            ) : (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                    🔒 해당 게시판은 열람 권한이 없습니다.
                </p>
            )}
        </div>
    );
}
