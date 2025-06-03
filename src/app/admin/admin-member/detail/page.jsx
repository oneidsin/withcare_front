'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import '../member.css';
import './detail.css';

export default function MemberDetailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [timelines, setTimelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'activity', 'timeline'
    
    // 페이지네이션 상태 추가
    const [currentPostPage, setCurrentPostPage] = useState(1);
    const [currentCommentPage, setCurrentCommentPage] = useState(1);
    const postsPerPage = 5;
    const commentsPerPage = 5;

    useEffect(() => {
        if (!id) return;

        const fetchMemberDetail = async () => {
            try {
                const token = sessionStorage.getItem('token');

                // 회원 상세 정보 조회
                const memberRes = await axios.post(
                    'http://localhost/admin/member/detail',
                    { id },
                    { headers: { Authorization: token } }
                );

                if (memberRes.data.success) {
                    setMember(memberRes.data.data);
                    console.log(memberRes.data.data);
                } else {
                    alert('회원 정보를 불러오는데 실패했습니다.');
                    router.push('/admin/admin-member');
                    return;
                }

                // 활동 내역 조회 (게시글, 댓글, 타임라인)
                const postsRes = await axios.get(
                    `http://localhost/admin/member/${id}/posts`,
                    { headers: { Authorization: token } }
                );

                const commentsRes = await axios.get(
                    `http://localhost/admin/member/${id}/comments`,
                    { headers: { Authorization: token } }
                );

                const timelinesRes = await axios.get(
                    `http://localhost/admin/member/${id}/timelines`,
                    { headers: { Authorization: token } }
                );

                setPosts(postsRes.data.data || []);
                
                // 댓글 데이터 디버깅 로그 추가
                console.log('댓글 데이터 응답:', commentsRes.data);
                if (commentsRes.data && commentsRes.data.data) {
                    console.log('댓글 데이터 상세:', commentsRes.data.data);
                    // 첫 번째 댓글의 필드 구조 확인
                    if (commentsRes.data.data.length > 0) {
                        console.log('첫 번째 댓글 구조:', commentsRes.data.data[0]);
                    }
                }
                
                setComments(commentsRes.data.data || []);
                setTimelines(timelinesRes.data.data || []);

                setLoading(false);
            } catch (error) {
                console.error('회원 상세 정보 조회 실패:', error);
                alert('데이터를 불러오는데 실패했습니다.');
                router.push('/admin/admin-member');
            }
        };

        fetchMemberDetail();
    }, [id, router]);

    // 차단 처리 페이지로 이동 또는 차단 해제
    const blockProcessPage = (blocked_id) => {
        if (member.block_yn) {
            // 이미 차단된 상태면 차단 해제
            handleUnblockUser(blocked_id);
        } else {
            // 차단되지 않은 상태면 차단 처리 페이지로 이동
            console.log(blocked_id);
            router.push(`/admin/admin-block/process?blocked_id=${blocked_id}`);
        }
    };

    // 차단 해제 함수
    const handleUnblockUser = async (blocked_id) => {
        try {
            const id = sessionStorage.getItem('id');
            const token = sessionStorage.getItem('token');

            if (!confirm(`${blocked_id} 회원의 차단을 해제하시겠습니까?`)) return;

            const res = await axios.put(
                'http://localhost/admin/block/cancel',
                {
                    id: id,
                    blocked_id: blocked_id
                },
                { headers: { Authorization: token } }
            );

            if (res.data.result) {
                alert('차단이 해제되었습니다.');
                // 페이지 새로고침
                window.location.reload();
            } else {
                alert('차단 해제에 실패했습니다.');
            }
        } catch (error) {
            console.error('차단 해제 실패:', error);
            alert('처리 중 오류가 발생했습니다.');
        }
    };

    const handleGrantAdmin = async () => {
        try {
            const token = sessionStorage.getItem('token');

            if (!confirm(`${id} 회원의 관리자 권한을 ${member.admin_yn ? '해제' : '부여'}하시겠습니까?`)) return;

            const res = await axios.put(
                'http://localhost/admin/grant',
                {
                    id,
                    lv_idx: member.admin_yn ? 1 : 7 // 관리자는 7, 일반회원은 1
                },
                { headers: { Authorization: token } }
            );

            if (res.data.success) {
                alert(`관리자 권한이 ${member.admin_yn ? '해제' : '부여'}되었습니다.`);
                // 페이지 새로고침
                window.location.reload();
            } else {
                alert('처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('관리자 권한 변경 실패:', error);
            alert('처리 중 오류가 발생했습니다.');
        }
    };

    // 페이지네이션 함수
    const paginate = (array, pageNumber, itemsPerPage) => {
        const startIndex = (pageNumber - 1) * itemsPerPage;
        return array.slice(startIndex, startIndex + itemsPerPage);
    };

    // 페이지 번호 생성 함수
    const generatePageNumbers = (totalItems, itemsPerPage, currentPage) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // 표시할 페이지 번호 범위 계산 (최대 5개)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // 5개 페이지 번호를 유지하기 위한 조정
        if (endPage - startPage < 4 && totalPages > 5) {
            if (startPage === 1) {
                endPage = 5;
            } else if (endPage === totalPages) {
                startPage = Math.max(1, totalPages - 4);
            }
        }
        
        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        
        return { pageNumbers, totalPages };
    };

    if (loading) {
        return <div className="loading">로딩 중...</div>;
    }

    if (!member) {
        return <div className="error">회원 정보를 찾을 수 없습니다.</div>;
    }

    // 현재 페이지에 표시할 게시글과 댓글
    const currentPosts = paginate(posts, currentPostPage, postsPerPage);
    const currentComments = paginate(comments, currentCommentPage, commentsPerPage);
    
    // 페이지 번호 계산
    const { pageNumbers: postPageNumbers, totalPages: totalPostPages } = 
        generatePageNumbers(posts.length, postsPerPage, currentPostPage);
    const { pageNumbers: commentPageNumbers, totalPages: totalCommentPages } = 
        generatePageNumbers(comments.length, commentsPerPage, currentCommentPage);

    return (
        <div className="member-detail-container">
            <div className="member-detail-header">
                <h2>{id} 회원 상세정보</h2>
                <div className="member-actions">
                    <button
                        className={`block-button ${member.block_yn ? 'active' : ''}`}
                        onClick={() => blockProcessPage(id)}
                    >
                        {member.block_yn ? '차단 해제' : '회원 차단'}
                    </button>
                    <button
                        className={`admin-button ${member.admin_yn ? 'active' : ''}`}
                        onClick={handleGrantAdmin}
                    >
                        {member.admin_yn ? '관리자 해제' : '관리자 권한 부여'}
                    </button>
                    <button
                        className="back-button"
                        onClick={() => router.push('/admin/admin-member')}
                    >
                        목록으로
                    </button>
                </div>
            </div>

            <div className="tab-container">
                <div className="tab-menu">
                    <button
                        className={activeTab === 'basic' ? 'active' : ''}
                        onClick={() => setActiveTab('basic')}
                    >
                        기본 정보
                    </button>
                    <button
                        className={activeTab === 'activity' ? 'active' : ''}
                        onClick={() => setActiveTab('activity')}
                    >
                        활동
                    </button>
                    <button
                        className={activeTab === 'timeline' ? 'active' : ''}
                        onClick={() => setActiveTab('timeline')}
                    >
                        타임라인
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'basic' && (
                        <div className="member-info">
                            <div className="profile-section">
                                <div className="profile-image">
                                    <img
                                        src={member.profile_photo || '/defaultProfileImg.png'}
                                        alt="프로필 이미지"
                                        onError={(e) => e.target.src = '/defaultProfileImg.png'}
                                    />
                                </div>
                                <div className="profile-details">
                                    <h3>{member.name}</h3>
                                    <p className="intro">{member.intro || '소개글이 없습니다.'}</p>
                                </div>
                            </div>

                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">아이디</span>
                                    <span className="value">{member.id}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">이름</span>
                                    <span className="value">{member.name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">이메일</span>
                                    <span className="value">{member.email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">가입일</span>
                                    <span className="value">{new Date(member.join_date).toLocaleDateString()}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">최근 접속일</span>
                                    <span className="value">{new Date(member.access_date).toLocaleDateString()}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">회원 레벨</span>
                                    <span className="value">{member.lv_name} ({member.lv_idx})</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">관리자 여부</span>
                                    <span className="value">{member.admin_yn ? 'Y' : 'N'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">차단 여부</span>
                                    <span className="value">{member.block_yn ? 'Y' : 'N'}</span>
                                </div>
                                {member.block_yn && (
                                    <>
                                        <div className="info-item">
                                            <span className="label">차단 사유</span>
                                            <span className="value">{member.block_reason || '-'}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">차단 시작일</span>
                                            <span className="value">{member.block_start_date}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">차단 종료일</span>
                                            <span className="value">{member.block_end_date}</span>
                                        </div>
                                    </>
                                )}
                                <div className="info-item">
                                    <span className="label">프로필 공개 여부</span>
                                    <span className="value">{member.profile_yn ? 'Y' : 'N'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">암종</span>
                                    <span className="value">{member.cancer_name || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">병기</span>
                                    <span className="value">{member.stage_name || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">보유 배지</span>
                                    <span className="value">{member.bdg_name || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">접속 수</span>
                                    <span className="value">{member.access_cnt || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="activity-section">
                            <div className="activity-posts">
                                <h3>작성 게시글</h3>
                                {posts.length > 0 ? (
                                    <>
                                        <table className="activity-table">
                                            <thead>
                                                <tr>
                                                    <th>글번호</th>
                                                    <th>제목</th>
                                                    <th>작성일</th>
                                                    <th>조회수</th>
                                                    <th>추천수</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentPosts.map(post => (
                                                    <tr key={post.post_idx} onClick={() => window.open(`/post/detail?post_idx=${post.post_idx}`, '_blank')}>
                                                        <td>{post.post_idx}</td>
                                                        <td>{post.post_title}</td>
                                                        <td>{new Date(post.post_create_date).toLocaleDateString()}</td>
                                                        <td>{post.post_view_cnt || 0}</td>
                                                        <td>{post.like_cnt || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        
                                        {posts.length > postsPerPage && (
                                            <div className="pagination">
                                                <button 
                                                    className="pagination-button"
                                                    onClick={() => setCurrentPostPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPostPage === 1}
                                                >
                                                    &lt;
                                                </button>
                                                
                                                {postPageNumbers.map(number => (
                                                    <button
                                                        key={number}
                                                        className={`pagination-button ${currentPostPage === number ? 'active' : ''}`}
                                                        onClick={() => setCurrentPostPage(number)}
                                                    >
                                                        {number}
                                                    </button>
                                                ))}
                                                
                                                <button
                                                    className="pagination-button"
                                                    onClick={() => setCurrentPostPage(prev => Math.min(prev + 1, totalPostPages))}
                                                    disabled={currentPostPage === totalPostPages}
                                                >
                                                    &gt;
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="no-data">작성한 게시글이 없습니다.</p>
                                )}
                            </div>

                            <div className="activity-comments">
                                <h3>작성 댓글</h3>
                                {comments.length > 0 ? (
                                    <>
                                        <table className="activity-table">
                                            <thead>
                                                <tr>
                                                    <th>게시글</th>
                                                    <th>댓글 내용</th>
                                                    <th>작성일</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentComments.map((comment, index) => {
                                                    // 댓글 데이터 필드 확인 및 안전하게 접근
                                                    const postTitle = comment.post_title || '제목 없음';
                                                    const postIdx = comment.post_idx || '';
                                                    const commentContent = comment.com_content || comment.content || '내용 없음';
                                                    
                                                    // 날짜 형식 확인 및 안전하게 변환
                                                    let commentDate = '날짜 정보 없음';
                                                    const dateField = comment.com_create_date || comment.createDate;
                                                    if (dateField) {
                                                        try {
                                                            commentDate = new Date(dateField).toLocaleDateString();
                                                        } catch (e) {
                                                            console.error('날짜 변환 오류:', e);
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <tr 
                                                            key={comment.com_idx || index} 
                                                            onClick={() => postIdx && window.open(`/post/detail?post_idx=${postIdx}`, '_blank')}
                                                        >
                                                            <td>{postTitle}</td>
                                                            <td>{commentContent}</td>
                                                            <td>{commentDate}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        
                                        {comments.length > commentsPerPage && (
                                            <div className="pagination">
                                                <button 
                                                    className="pagination-button"
                                                    onClick={() => setCurrentCommentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentCommentPage === 1}
                                                >
                                                    &lt;
                                                </button>
                                                
                                                {commentPageNumbers.map(number => (
                                                    <button
                                                        key={number}
                                                        className={`pagination-button ${currentCommentPage === number ? 'active' : ''}`}
                                                        onClick={() => setCurrentCommentPage(number)}
                                                    >
                                                        {number}
                                                    </button>
                                                ))}
                                                
                                                <button
                                                    className="pagination-button"
                                                    onClick={() => setCurrentCommentPage(prev => Math.min(prev + 1, totalCommentPages))}
                                                    disabled={currentCommentPage === totalCommentPages}
                                                >
                                                    &gt;
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="no-data">작성한 댓글이 없습니다.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="timeline-section">
                            <h3>타임라인</h3>
                            {timelines.length > 0 ? (
                                <div className="timeline-list">
                                    {timelines.map(timeline => (
                                        <div key={timeline.timeline_idx} className="timeline-item">
                                            <div className="timeline-date">
                                                {new Date(timeline.timeline_date).toLocaleDateString()}
                                            </div>
                                            <div className="timeline-content">
                                                <h4>{timeline.timeline_title}</h4>
                                                <p>{timeline.timeline_cont}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">타임라인 기록이 없습니다.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}