import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function RecommendedPosts() {
    const [recommendedPosts, setRecommendedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadRecommendedPosts();
    }, []);

    const loadRecommendedPosts = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: token } : {};
            const endpoint = '/search/recommend/default';
            const response = await axios.get(`http://localhost${endpoint}`, { headers });

            if (response.data && response.data.success) {
                const sortedPosts = (response.data.data || []).sort((a, b) =>
                    (b.like_count || 0) - (a.like_count || 0)
                );
                setRecommendedPosts(sortedPosts);
            } else {
                setRecommendedPosts([]);
            }
        } catch (err) {
            setRecommendedPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePostClick = (post) => {
        router.push(`/post/detail?post_idx=${post.post_idx}&board_idx=${post.board_idx}`);
    };

    return (
        <div className="card mini-card">
            <h2>추천 게시글</h2>
            <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
            {loading ? (
                <p>로딩 중...</p>
            ) : recommendedPosts.length > 0 ? (
                <div className="recommended-posts-scroll">
                    {recommendedPosts.map((post, idx) => (
                        <div
                            key={idx}
                            className="recommended-post-item"
                            onClick={() => handlePostClick(post)}
                        >
                            <p className="post-title">{post.title}</p>
                            <div className="post-meta">
                                <span>{post.writer || "익명"}</span>
                                <span>추천 {post.like_count || 0}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>추천 게시글이 없습니다.</p>
            )}
        </div>
    );
}
