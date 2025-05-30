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

    // 정보 게시판 board_idx (5, 6번)
    const INFO_BOARD_IDS = [5, 6];
    // 기본 정보 게시판 ID
    const DEFAULT_INFO_BOARD_ID = 5;

    useEffect(() => {
        checkLoginStatus();
        fetchBoardInfo();
    }, []);

    // 게시판 정보 가져오기
    const fetchBoardInfo = async () => {
        try {
            const response = await axios.get(`http://localhost/board/${DEFAULT_INFO_BOARD_ID}`);
            setBoardInfo(response.data);
            
            // 게시판이 블라인드 처리되지 않았는지 확인
            setIsBoardAccessible(!response.data.blind_yn);
        } catch (err) {
            console.error('게시판 정보 로드 오류:', err);
            setIsBoardAccessible(false);
        }
    };

    // 로그인 상태 확인 및 게시글 로드
    const checkLoginStatus = () => {
        const token = sessionStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            loadCancerRelatedPosts(token);
        } else {
            setIsLoggedIn(false);
            loadDefaultRecommendedPosts();
        }
    };

    // 사용자 프로필에 맞는 암 관련 게시글 로드 (로그인 사용자용)
    const loadCancerRelatedPosts = async (token) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost/search/cancer', {}, {
                headers: {
                    'Authorization': token
                }
            });

            console.log('암 관련 게시글 응답:', response.data);

            if (response.data && response.data.success) {
                // 게시글 데이터 설정 (이미 board_idx 5, 6 필터링됨)
                // 추천수(like_count) 기준으로 내림차순 정렬
                const sortedPosts = (response.data.data || [])
                    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
                    // 데이터 구조 정규화 - title 필드 확인 및 표준화
                    .map(post => ({
                        ...post,
                        title: post.title || post.post_title || '제목 없음' // title이 없으면 post_title 사용, 둘 다 없으면 기본값
                    }));
                
                console.log('정규화된 게시글 데이터:', sortedPosts);
                setCancerPosts(sortedPosts);
                
                // 백엔드에서 프로필 정보도 함께 제공하는 경우 (없으면 생략)
                if (response.data.profile) {
                    setUserProfile(response.data.profile);
                }
            } else {
                console.warn('암 관련 게시글 로드 실패:', response.data.message);
                // 실패 시 기본 추천 게시글 로드로 폴백
                loadDefaultRecommendedPosts();
            }
        } catch (err) {
            console.error('암 관련 게시글 로드 오류:', err);
            // 오류 시 기본 추천 게시글 로드로 폴백
            loadDefaultRecommendedPosts();
        } finally {
            setLoading(false);
        }
    };

    // 기본 추천 게시글 로드 (비로그인 사용자용)
    const loadDefaultRecommendedPosts = async () => {
        setLoading(true);
        try {
            // 백엔드에서 제공하는 추천 게시글 API 호출
            const response = await axios.get('http://localhost/search/recommend/default');

            console.log('기본 추천 게시글 응답:', response.data);

            if (response.data && response.data.success) {
                // 기본 추천 게시글 중 정보 게시판(board_idx: 5, 6)에 해당하는 게시글만 필터링
                const filteredPosts = (response.data.data || [])
                    .filter(post => INFO_BOARD_IDS.includes(post.board_idx))
                    // 데이터 구조 정규화 - title 필드 확인 및 표준화
                    .map(post => ({
                        ...post,
                        title: post.title || post.post_title || '제목 없음' // title이 없으면 post_title 사용, 둘 다 없으면 기본값
                    }));

                console.log('필터링된 정보 게시판 게시글:', filteredPosts);

                if (filteredPosts.length === 0) {
                    // 필터링 결과가 없으면 기본 정보 게시판 게시글 가져오기
                    loadInfoBoardPosts();
                } else {
                    // 추천수(like_count) 기준으로 내림차순 정렬
                    const sortedPosts = filteredPosts.sort((a, b) =>
                        (b.like_count || 0) - (a.like_count || 0)
                    );
                    setCancerPosts(sortedPosts);
                }
            } else {
                console.warn('기본 추천 게시글 로드 실패:', response.data.message);
                // 추천 게시글 로드 실패 시 정보 게시판 게시글 직접 로드
                loadInfoBoardPosts();
            }
        } catch (err) {
            console.error('기본 추천 게시글 로드 오류:', err);
            // 오류 시 정보 게시판 게시글 직접 로드
            loadInfoBoardPosts();
        } finally {
            setLoading(false);
        }
    };

    // 정보 게시판(board_idx: 5, 6) 게시글 직접 로드 (추천 API 실패 시 대체 방법)
    const loadInfoBoardPosts = async () => {
        try {
            setLoading(true);

            // 정보 게시판 게시글 조회 (가장 최근 5개)
            const response = await axios.post('http://localhost/search', {
                board_idx: DEFAULT_INFO_BOARD_ID, // 기본 정보 게시판 ID
                page: 1,
                pageSize: 5,
                offset: 0,
                sch_type: '제목+내용',
                sch_keyword: '' // 빈 검색어로 모든 게시글 조회
            });

            if (response.data && response.data.success) {
                // 추천수(like_count) 기준으로 내림차순 정렬
                const sortedPosts = (response.data.data || [])
                    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
                    // 데이터 구조 정규화 - title 필드 확인 및 표준화
                    .map(post => ({
                        ...post,
                        title: post.title || post.post_title || '제목 없음' // title이 없으면 post_title 사용, 둘 다 없으면 기본값
                    }));

                console.log('정규화된 정보 게시판 게시글:', sortedPosts);
                setCancerPosts(sortedPosts);
            } else {
                setCancerPosts([]);
            }
        } catch (err) {
            console.error('정보 게시판 게시글 로드 오류:', err);
            setCancerPosts([]);
        } finally {
            setLoading(false);
        }
    };

    // 개별 게시글 클릭 시 상세 페이지로 이동
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
                        userProfile ? (
                            <>내 프로필 정보에 맞는 추천 게시글</>
                        ) : (
                            <>암 관련 맞춤 정보를 확인하세요.</>
                        )
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