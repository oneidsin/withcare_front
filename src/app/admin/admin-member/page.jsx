'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import './member.css';
import { useRouter } from 'next/navigation';

export default function AdminMemberPage() {
    const router = useRouter();
    const [members, setMembers] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [sortField, setSortField] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [adminFilter, setAdminFilter] = useState('');
    const [blockFilter, setBlockFilter] = useState('');
    const [delFilter, setDelFilter] = useState('');

    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    const fetchMembers = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post(
                'http://localhost/admin/member/list',
                {
                    searchId,
                    sortField,
                    sortOrder,
                    page,
                    size: 10,
                    adminFilter,
                    blockFilter,
                    delFilter,
                },
                {
                    headers: { Authorization: token },
                }
            );

            if (response.data.success) {
                setMembers(response.data.data);
                setTotalPages(response.data.totalPages);
                setSearchId('');
            } else {
                alert('권한이 없습니다.');
            }
        } catch (err) {
            console.error(err);
            alert('데이터를 불러오는데 실패했습니다.');
        }
    };

    // 필터 자동 조회
    useEffect(() => {
        fetchMembers();
    }, [page, adminFilter, blockFilter, delFilter, sortField, sortOrder]);

    const handleGrant = async (id, yn) => {
        const lv_idx = yn === 'Y' ? 7 : 1;
        console.log(`권한 변경 시도: ${id}, 값: ${yn}, lv_idx: ${lv_idx}`);

        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.put(
                'http://localhost/admin/grant',
                { id, lv_idx },
                {
                    headers: { Authorization: token },
                }
            );
            console.log('응답 결과:', res.data);
            
            if (res.data.success) {
                alert('권한 변경 완료');
                window.location.reload(); // 페이지 새로고침
            } else {
                console.error('권한 변경 실패:', res.data);
                alert('권한 변경 실패');
            }
        } catch (err) {
            console.error(err);
            alert('요청 실패');
        }
    };

    const handleMemberClick = (id) => {
        router.push(`/admin/admin-member/detail?id=${id}`);
    };

    return (
        <div className="admin-container">
            {/* Main Content */}
            <div className="admin-content">
                <div className="admin-header">
                    <h2>유저 리스트</h2>
                    <div>

                        <select className="select-bar" value={sortField} onChange={e => setSortField(e.target.value)}>
                            <option value="">정렬 기준 선택</option>
                            <option value="join_date">가입일</option>
                            <option value="access_date">최근접속일</option>
                        </select>
                        &nbsp;&nbsp;
                        <select className="select-bar" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                            <option value="DESC">내림차순</option>
                            <option value="ASC">오름차순</option>
                        </select>
                        &nbsp;&nbsp;
                        <input
                            type="text"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.keyCode === 13) fetchMembers();
                            }}
                            placeholder="아이디 검색"
                            className="search-input"
                        />
                        <button onClick={fetchMembers} className="search-button">
                            조회
                        </button>

                    </div>
                </div>

                <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th>회원 ID</th>
                        <th>
                            <select className="select-bar" value={adminFilter} onChange={e => setAdminFilter(e.target.value)}>
                                <option value="">회원 전체</option>
                                <option value="Y">관리자만</option>
                                <option value="N">일반회원만</option>
                            </select>
                        </th>
                        <th>
                            <select className="select-bar" value={blockFilter} onChange={e => setBlockFilter(e.target.value)}>
                                <option value="">차단 여부 전체</option>
                                <option value="Y">차단된 유저</option>
                                <option value="N">차단 안됨</option>
                            </select>
                        </th>
                        <th>차단 시작일</th>
                        <th>차단 종료일</th>
                        <th>
                            <select className="select-bar" value={delFilter} onChange={e => setDelFilter(e.target.value)}>
                                <option value="">탈퇴 여부 전체</option>
                                <option value="Y">탈퇴한 유저</option>
                                <option value="N">탈퇴 안함</option>
                            </select>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {members.map((m, i) => (
                        <tr key={i}>
                            <td className="member-id" onClick={() => handleMemberClick(m.id)}>{m.id}</td>
                            <td>
                                <select
                                    value={m.admin_yn ? 'Y' : 'N'}
                                    onChange={(e) => handleGrant(m.id, e.target.value)}
                                >
                                    <option value="Y">Y</option>
                                    <option value="N">N</option>
                                </select>
                            </td>
                            <td>{m.block_yn ? 'Y' : 'N'}</td>
                            <td>{m.block_start_date || '-'}</td>
                            <td>{m.block_end_date || '-'}</td>
                            <td>{m.quit_yn ? 'Y' : 'N'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
                <div className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                            key={num}
                            onClick={() => setPage(num)}
                            style={{
                                margin: '0 4px',
                                padding: '6px 12px',
                                backgroundColor: num === page ? '#333' : '#fff',
                                color: num === page ? '#fff' : '#000',
                                border: '1px solid #ccc',
                                cursor: 'pointer'
                            }}
                        >
                            {num}
                        </button>
                    ))}
                </div>
        </div>
    </div>
    );
}