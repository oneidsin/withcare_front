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
    const [isPersonalized, setIsPersonalized] = useState(false);
    const [cancerList, setCancerList] = useState([]);
    const [stageList, setStageList] = useState([]);

    const INFO_BOARD_IDS = [5, 6];
    const DEFAULT_INFO_BOARD_ID = 5;

    useEffect(() => {
        console.log("InfoBoard 컴포넌트 마운트");
        fetchCancerStageData();
        checkLoginStatus();
        fetchBoardInfo();
    }, []);

    // 암 종류와 병기 데이터 가져오기
    const fetchCancerStageData = async () => {
        try {
            const [cancerRes, stageRes] = await Promise.all([
                axios.get("http://localhost/cancer"),
                axios.get("http://localhost/stage")
            ]);

            setCancerList(cancerRes.data || []);
            setStageList(stageRes.data || []);
            console.log("암 종류 목록:", cancerRes.data);
            console.log("병기 목록:", stageRes.data);
            return { cancerList: cancerRes.data, stageList: stageRes.data };
        } catch (err) {
            console.error("암 종류/병기 데이터 로딩 실패:", err);
            return { cancerList: [], stageList: [] };
        }
    };

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

    const checkLoginStatus = async () => {
        const token = sessionStorage.getItem('token');
        const id = sessionStorage.getItem('id');

        console.log("세션 토큰:", token ? "있음" : "없음");
        console.log("세션 ID:", id || "없음");

        // 로그인 상태 확인
        if (!token || !id) {
            console.log("로그아웃 상태 → 인기 게시글 로딩");
            setIsLoggedIn(false);
            loadInfoBoardPosts();
            return;
        }

        // 로그인 상태
        setIsLoggedIn(true);

        try {
            // 암 종류와 병기 목록이 없으면 가져오기
            let cancerData = cancerList;
            let stageData = stageList;

            if (cancerList.length === 0 || stageList.length === 0) {
                const data = await fetchCancerStageData();
                cancerData = data.cancerList;
                stageData = data.stageList;
            }

            // 프로필 정보 가져오기 시도
            let profileStr = sessionStorage.getItem('profile');
            console.log("세션 프로필 문자열:", profileStr || "없음");

            // 프로필 정보가 없으면 서버에서 가져오기
            if (!profileStr || profileStr === '{}') {
                console.log("세션에 프로필 정보 없음, 서버에서 가져오기 시도");
                try {
                    const profileRes = await axios.get(`http://localhost/profile/${id}`, {
                        headers: { Authorization: token }
                    });

                    if (profileRes.data && profileRes.data.data) {
                        const profileData = profileRes.data.data;
                        console.log("서버에서 가져온 프로필 정보:", profileData);

                        // cancer_idx와 stage_idx를 실제 이름으로 변환
                        let cancerName = "정보 없음";
                        let stageName = "정보 없음";

                        // cancer_idx 변환 (0이 아닌 유효한 값일 때만)
                        if (profileData.cancer_idx && profileData.cancer_idx !== 0 && cancerData.length > 0) {
                            const foundCancer = cancerData.find(cancer => cancer.cancer_idx === profileData.cancer_idx);
                            if (foundCancer) {
                                cancerName = foundCancer.cancer_name;
                                console.log("암 종류 변환:", profileData.cancer_idx, "→", cancerName);
                            }
                        }

                        // stage_idx 변환 (0이 아닌 유효한 값일 때만)
                        if (profileData.stage_idx && profileData.stage_idx !== 0 && stageData.length > 0) {
                            const foundStage = stageData.find(stage => stage.stage_idx === profileData.stage_idx);
                            if (foundStage) {
                                stageName = foundStage.stage_name;
                                console.log("병기 변환:", profileData.stage_idx, "→", stageName);
                            }
                        }

                        // 프로필 정보 객체 생성
                        const profile = {
                            id: id,
                            name: profileData.name || id,
                            cancer: cancerName,
                            stage: stageName,
                            cancer_idx: profileData.cancer_idx || 0,
                            stage_idx: profileData.stage_idx || 0
                        };

                        // 세션스토리지에 저장
                        sessionStorage.setItem('profile', JSON.stringify(profile));
                        profileStr = JSON.stringify(profile);
                        console.log("세션에 프로필 정보 저장됨:", profile);
                    } else {
                        console.log("서버에서 프로필 정보를 가져올 수 없음");
                    }
                } catch (err) {
                    console.error("프로필 정보 가져오기 실패:", err);
                }
            } else {
                // 이미 프로필 정보가 있지만 cancer와 stage가 "정보 없음"인 경우
                // cancer_idx와 stage_idx를 기반으로 실제 이름 업데이트
                try {
                    const profile = JSON.parse(profileStr);
                    let updated = false;

                    if ((profile.cancer === "정보 없음" || !profile.cancer) &&
                        profile.cancer_idx && profile.cancer_idx !== 0 && cancerData.length > 0) {
                        const foundCancer = cancerData.find(cancer => cancer.cancer_idx === profile.cancer_idx);
                        if (foundCancer) {
                            profile.cancer = foundCancer.cancer_name;
                            updated = true;
                            console.log("기존 프로필 암 종류 업데이트:", profile.cancer_idx, "→", profile.cancer);
                        }
                    }

                    if ((profile.stage === "정보 없음" || !profile.stage) &&
                        profile.stage_idx && profile.stage_idx !== 0 && stageData.length > 0) {
                        const foundStage = stageData.find(stage => stage.stage_idx === profile.stage_idx);
                        if (foundStage) {
                            profile.stage = foundStage.stage_name;
                            updated = true;
                            console.log("기존 프로필 병기 업데이트:", profile.stage_idx, "→", profile.stage);
                        }
                    }

                    if (updated) {
                        sessionStorage.setItem('profile', JSON.stringify(profile));
                        profileStr = JSON.stringify(profile);
                        console.log("업데이트된 프로필 정보:", profile);
                    }
                } catch (err) {
                    console.error("프로필 정보 업데이트 실패:", err);
                }
            }

            // 프로필 정보 파싱 시도
            if (!profileStr || profileStr === '{}') {
                console.log("프로필 정보 없음 → 인기 게시글 로딩");
                loadInfoBoardPosts();
                return;
            }

            const profile = JSON.parse(profileStr);
            console.log("파싱된 프로필 정보:", profile);
            setUserProfile(profile);

            // 프로필에 암 정보가 있는지 확인
            const hasCancer = profile.cancer && profile.cancer !== "정보 없음";
            const hasStage = profile.stage && profile.stage !== "정보 없음";

            console.log("암 정보 있음:", hasCancer, "병기 정보 있음:", hasStage);

            if (hasCancer || hasStage) {
                console.log("프로필에 암/병기 정보 있음 → 맞춤 게시글 로딩 시도");
                loadCancerRelatedPosts(token, profile);
            } else {
                console.log("프로필에 암/병기 정보 없음 → 인기 게시글 로딩");
                loadInfoBoardPosts();
            }
        } catch (err) {
            console.error("프로필 파싱 실패 → 인기 게시글 로딩:", err);
            loadInfoBoardPosts();
        }
    };

    const loadCancerRelatedPosts = async (token, profile) => {
        setLoading(true);
        try {
            console.log("프로필 정보:", profile);

            // 백엔드 API는 프로필 정보를 기반으로 검색하므로 별도의 파라미터 전송 불필요
            // 단, 백엔드가 요구하는 경우를 대비해 빈 객체라도 전송
            const response = await axios.post('http://localhost/search/cancer', {}, {
                headers: {
                    Authorization: token
                }
            });

            console.log("맞춤 게시글 응답:", response.data);
            const posts = response.data?.data || [];

            if (response.data?.success && posts.length > 0) {
                const filteredPosts = posts.filter(post =>
                    INFO_BOARD_IDS.includes(post.board_idx)
                );

                if (filteredPosts.length === 0) {
                    console.log("추천 게시글 없음 → 인기 게시글 로딩");
                    loadInfoBoardPosts();
                    return;
                }

                const normalizedPosts = filteredPosts.map(post => ({
                    ...post,
                    title: post.title || post.post_title || '제목 없음',
                    like_count: post.like_count || 0
                }));

                setCancerPosts(normalizedPosts);
                setIsPersonalized(true);
                console.log("맞춤 게시글 로드 성공:", normalizedPosts);
            } else {
                console.log("추천 게시글 없음 → 인기 게시글 로딩");
                loadInfoBoardPosts();
            }
        } catch (err) {
            console.error('추천 게시글 로딩 중 오류 발생:', err);
            loadInfoBoardPosts(); // fallback
        } finally {
            setLoading(false);
        }
    };

    const loadInfoBoardPosts = async () => {
        try {
            setLoading(true);
            setIsPersonalized(false);
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

            // 추천 수(좋아요) 기준으로 정렬
            const sortedPosts = allPosts
                .sort((a, b) => (b.like_count || 0) - (a.like_count || 0));

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
                    {isLoggedIn && isPersonalized ? (
                        <>내 프로필 정보에 맞는 추천 게시글</>
                    ) : (
                        <>인기 정보 게시글을 확인하세요. {isLoggedIn ? '프로필 정보를 입력하시면' : '로그인하시면'} 맞춤 정보를 제공해드립니다.</>
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
                            className={`cancer-post-item ${isPersonalized ? 'personalized' : ''}`}
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
