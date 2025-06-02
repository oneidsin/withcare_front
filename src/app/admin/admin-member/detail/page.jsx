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

    const handleBlockUser = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const reason = prompt('차단 사유를 입력해주세요:');

            if (!reason) return;

            const res = await axios.post(
                'http://localhost/admin/block',
                {
                    id,
                    block_reason: reason,
                    block_days: 7 // 기본 7일 차단
                },
                { headers: { Authorization: token } }
            );

            if (res.data.success) {
                alert('회원이 차단되었습니다.');
                // 페이지 새로고침
                window.location.reload();
            } else {
                alert('회원 차단에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원 차단 실패:', error);
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

    if (loading) {
        return <div className="loading">로딩 중...</div>;
    }

    if (!member) {
        return <div className="error">회원 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="member-detail-container">
            <div className="member-detail-header">
                <h2>{id} 회원 상세정보</h2>
                <div className="member-actions">
                    <button
                        className={`block-button ${member.block_yn ? 'active' : ''}`}
                        onClick={handleBlockUser}
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
                                            {posts.map(post => (
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
                                ) : (
                                    <p className="no-data">작성한 게시글이 없습니다.</p>
                                )}
                            </div>

                            <div className="activity-comments">
                                <h3>작성 댓글</h3>
                                {comments.length > 0 ? (
                                    <table className="activity-table">
                                        <thead>
                                            <tr>
                                                <th>게시글</th>
                                                <th>댓글 내용</th>
                                                <th>작성일</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comments.map(comment => (
                                                <tr key={comment.com_idx} onClick={() => window.open(`/post/detail?post_idx=${comment.post_idx}`, '_blank')}>
                                                    <td>{comment.post_title || `게시글 ${comment.post_idx}`}</td>
                                                    <td>{comment.com_cont}</td>
                                                    <td>{new Date(comment.com_create_date).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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