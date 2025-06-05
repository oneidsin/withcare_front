import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function InfoBoard() {
    const router = useRouter();
    const [cancerPosts, setCancerPosts] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [boardInfo, setBoardInfo] = useState(null);
    const [isBoardAccessible, setIsBoardAccessible] = useState(false);

    const INFO_BOARD_IDS = [5, 6];
    const DEFAULT_INFO_BOARD_ID = 5;

    useEffect(() => {
        console.log("InfoBoard 컴포넌트 마운트");
        checkLoginStatus();
        fetchBoardInfo();
    }, []);

    const fetchBoardInfo = async () => {
        try {
            const response = await axios.get(`http://localhost/board/${DEFAULT_INFO_BOARD_ID}`);
            setBoardInfo(response.data);
            setIsBoardAccessible(!response.data.blind_yn);
        } catch (err) {
            console.error('게시판 정보 로드 오류:', err);
            setIsBoardAccessible(false);
        }
    };

    const checkLoginStatus = () => {
        const token = sessionStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            loadCancerRelatedPosts(token);
        } else {
            setIsLoggedIn(false);
            loadInfoBoardPosts();
        }
    };

    const loadCancerRelatedPosts = async (token) => {
        console.log("loadCancerRelatedPosts 함수 실행, 토큰:", token ? "있음" : "없음");
        setLoading(true);
        try {
            if (!token) {
                console.log("토큰이 없어 기본 정보 게시판 게시글을 로드합니다.");
                loadInfoBoardPosts();
                return;
            }

            // 암 관련 게시글 검색 API 호출
            console.log("암 관련 게시글 API 호출 시작");
            const response = await axios.post('http://localhost/search/cancer', {}, {
                headers: {
                    'Authorization': token
                }
            });

            console.log('암 관련 게시글 API 응답:', response.data);

            if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
                const posts = response.data.data;

                // board_idx 필터링만 남기고 정렬은 아예 제거
                const filteredPosts = posts.filter(post => INFO_BOARD_IDS.includes(post.board_idx));

                if (filteredPosts.length === 0) {
                    console.log('필터링 후 게시글이 없어 기본 정보 게시판 게시글을 로드합니다.');
                    loadInfoBoardPosts();
                    return;
                }

                // 정렬 없이 서버에서 온 순서 그대로 사용
                const normalizedPosts = filteredPosts.map(post => ({
                    ...post,
                    title: post.title || post.post_title || '제목 없음',
                    like_count: post.like_count || 0
                }));

                setCancerPosts(normalizedPosts);
            } else {
                console.warn('암 관련 게시글이 없거나 로드 실패:', response.data?.message || '알 수 없는 오류');
                loadInfoBoardPosts();
            }
        } catch (err) {
            console.error('암 관련 게시글 로드 중 오류 발생:', err);
            loadInfoBoardPosts();
        } finally {
            setLoading(false);
        }
    };


    const loadInfoBoardPosts = async () => {
        try {
            setLoading(true);
            const allPosts = [];

            for (const boardId of INFO_BOARD_IDS) {
                const response = await axios.post('http://localhost/search', {
                    board_idx: boardId,
                    page: 1,
                    pageSize: 5,
                    offset: 0,
                    sch_type: '제목+내용',
                    sch_keyword: ''
                });

                if (response.data?.success) {
                    const posts = (response.data.data || []).map(post => ({
                        ...post,
                        title: post.title || post.post_title || '제목 없음',
                        board_idx: boardId
                    }));
                    allPosts.push(...posts);
                }
            }

            const sortedPosts = allPosts
                .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
                .slice(0, 5);

            setCancerPosts(sortedPosts);
        } catch (err) {
            console.error('정보 게시판 게시글 로드 오류:', err);
            setCancerPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePostClick = (post) => {
        router.push(`/post/detail?post_idx=${post.post_idx}&board_idx=${post.board_idx}`);
    };

    return (
        <div className="card large-card">
            <h2>정보 게시판</h2>
            <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />

            <div className="cancer-info-header">
                <p>
                    {isLoggedIn ? (
                        <>내 프로필 정보에 맞는 추천 게시글</>
                    ) : (
                        <>인기 정보 게시글을 확인하세요. 로그인하시면 맞춤 정보를 제공해드립니다.</>
                    )}
                </p>
            </div>

            {loading ? (
                <p className="loading-text">게시글을 불러오는 중...</p>
            ) : cancerPosts.length > 0 ? (
                <div className="cancer-posts">
                    {cancerPosts.slice(0, 5).map((post, idx) => (
                        <div
                            key={idx}
                            className={`cancer-post-item ${isLoggedIn ? 'personalized' : ''}`}
                            onClick={() => handlePostClick(post)}
                        >
                            <h3 className="post-title">{post.title}</h3>
                            <div className="post-meta">
                                <span>{post.writer || "익명"}</span>
                                <span>추천 {post.like_count || 0}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>게시글이 없습니다.</p>
            )}
        </div>
    );
}
