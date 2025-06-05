'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { UserWithIcons } from '@/components/UserIcons';
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

    // 사용자 레벨과 게시판 레벨
    const [userLevel, setUserLevel] = useState(0);
    const [boardLevel, setBoardLevel] = useState(0);
    const [isAnonymousBoard, setIsAnonymousBoard] = useState(false);

    useEffect(() => {
        fetchPosts(boardIdx, page, sort, searchType, keyword);
        checkUserLevel();
        checkBoardLevel();
    }, [boardIdx, page, sort]);

    useEffect(() => {
        if (keyword.trim() === '' && posts.length === 0) {
            fetchPosts(boardIdx, 1, sort, searchType, '');
            setPage(1);
        }
    }, [keyword]);

    const checkUserLevel = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            const res = await axios.get('http://localhost/member/info', {
                headers: { Authorization: token }
            });
            if (res.data.success) {
                setUserLevel(res.data.lv_idx || 0);
            }
        } catch (err) {
            console.error('사용자 레벨 확인 실패:', err);
        }
    };

    const checkBoardLevel = async () => {
        try {
            const res = await axios.get(`http://localhost/board/${boardIdx}`);
            if (res.data) {
                setBoardLevel(res.data.lv_idx || 0);
                setIsAnonymousBoard(res.data.anony_yn === true);
            }
        } catch (err) {
            console.error('게시판 레벨 확인 실패:', err);
        }
    };

    const fetchPosts = async (boardIdx, page, sort, searchType = '', keyword = '') => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost/post/list/${page}`, {
                headers: { Authorization: token },
                params: { board_idx: boardIdx, sort, searchType, keyword }
            });

            setPosts(res.data.list || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (e) {
            // 알림 필요 없음
        }
    };

    // 관리자가 아닌 경우 블라인드 처리된 게시글 필터링
    const filteredPosts = userLevel === 7 
        ? posts 
        : posts.filter(item => !item.post.post_blind_yn);

    return (
        <div className="post-page">
            <div className="post-header">
                {userLevel >= boardLevel && (
                    <button className='write-button' onClick={() => router.push(`/post/write?board_idx=${boardIdx}`)}>
                        ✏ 글쓰기
                    </button>
                )}
            </div>

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
                {filteredPosts.map((item) => (
                    <tr key={`${item.post.board_idx}-${item.post.post_idx}`} onClick={() => router.push(`/post/detail?post_idx=${item.post.post_idx}`)} style={{ cursor: 'pointer' }}>
                        <td>{item.post.post_idx}</td>
                        <td>
                            {item.post.post_blind_yn && '🔒 '}
                            {item.post.post_title}
                            {item.photos && item.photos.length > 0 && <span> 📷</span>}
                            {item.commentCount > 0 && <span className="comment-count"> [{item.commentCount}]</span>}
                        </td>
                        <td>
                            <UserWithIcons 
                                userId={item.post.id} 
                                isAnonymousBoard={isAnonymousBoard}
                                onClick={(userId) => router.push(`/profile/view/${userId}`)}
                            />
                        </td>
                        <td>{item.post.post_view_cnt}</td>
                        <td>{item.likes || 0}</td>
                        <td>{item.post.post_create_date?.slice(0, 10)}</td>
                    </tr>
                ))}
                </tbody>
            </table>

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

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setPage(1);
                    fetchPosts(boardIdx, 1, sort, searchType, keyword);
                    setKeyword('');
                }}
                className="search-form"
            >
                <select className="post-sort-form" value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="latest">최신순</option>
                    <option value="recommend">인기순</option>
                </select>
                <select className="post-search-form" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="title_content">제목+내용</option>
                    <option value="id">작성자</option>
                </select>
                <input
                    className="post-search-input"
                    type="text"
                    placeholder="검색어 입력"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <button className="post-search-btn" type="submit">검색</button>
            </form>
        </div>
    );
}
