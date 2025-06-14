"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import './badge.css';

const API_BASE_URL = 'http://localhost:80';

export default function AdminBadge() {
    const router = useRouter();

    const [badges, setBadges] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [badgeFile, setBadgeFile] = useState(null);
    const [badgePreview, setBadgePreview] = useState('');
    const [badgeForm, setBadgeForm] = useState({
        bdg_name: '',
        bdg_condition: '',
        bdg_active_yn: true
    });
    const [isEditing, setIsEditing] = useState(false);

    // 관리자 권한 체크
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const id = sessionStorage.getItem('id');
        
        if (!token || !id) {
            alert('관리자 로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        
        // 임시로 관리자 권한 체크 건너뛰고 직접 배지 목록 호출
        console.log('임시로 관리자 권한 체크 건너뛰고 배지 목록 직접 호출');
        fetchBadges();
        
        // 관리자 권한 체크 (주석 처리)
        // checkAdminPrivilege(token);
    }, [router]);

    // 관리자 권한 확인
    const checkAdminPrivilege = async (token) => {
        try {
            const response = await axios.get('http://localhost:80/admin/check', {
                headers: {
                    'Authorization': token
                }
            });
            
            if (response.data.success && response.data.isAdmin) {
                // 관리자 권한이 있으면 배지 목록 가져오기
                fetchBadges();
            } else {
                alert('관리자 권한이 필요합니다.');
                router.push('/');
            }
        } catch (error) {
            console.error('관리자 권한 체크 실패:', error);
            if (error.response && error.response.status === 403) {
                alert('관리자 권한이 필요합니다.');
            } else {
                alert('권한 확인 중 오류가 발생했습니다.');
            }
            router.push('/');
        }
    };

    // 배지 이미지 URL 처리 함수
    const getBadgeImageUrl = (iconPath) => {
        if (!iconPath) return '/defaultProfileImg.png';
        
        // 이미 완전한 URL인 경우
        if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
            return iconPath;
        }
        
        // 상대 경로인 경우 백엔드 파일 서버 URL 추가
        if (iconPath.startsWith('badge/')) {
            return `http://localhost:80/file/${iconPath}`;
        }
        
        // 기본적으로 백엔드 파일 서버 경로 추가
        return `http://localhost:80/file/badge/${iconPath}`;
    };

    // 배지 목록 가져오기
    const fetchBadges = async () => {
        try {
            const token = sessionStorage.getItem('token');
            console.log('fetchBadges - 토큰 확인:', token);
            
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            const requestUrl = `${API_BASE_URL}/admin/bdg/list`;
            console.log('fetchBadges - 요청 URL:', requestUrl);
            console.log('fetchBadges - 요청 헤더:', { 'Authorization': token });

            const response = await axios.get(requestUrl, {
                headers: {
                    'Authorization': token
                }
            });
            
            console.log('fetchBadges - 응답:', response.data);
            
            if (response.data.success) {
                console.log('배지 목록:', response.data.badges);
                setBadges(response.data.badges || []);
            } else {
                alert(response.data.msg || '배지 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('배지 목록 조회 오류:', error);
            console.error('에러 상태:', error.response?.status);
            console.error('에러 응답:', error.response?.data);
            console.error('에러 설정:', error.config);
            
            if (error.response && error.response.status === 403) {
                alert('관리자 권한이 필요합니다.');
            } else if (error.response && error.response.status === 404) {
                alert('API 경로를 찾을 수 없습니다. 백엔드 서버와 API 경로를 확인해주세요.');
            } else {
                alert('배지 목록을 불러오는데 실패했습니다. 백엔드 서버가 실행 중인지, API 경로 및 CORS 설정을 확인해주세요.');
            }
        }
    };

    // 배지 선택 시
    const handleSelectBadge = (badge) => {
        setSelectedBadge(badge);
        setBadgeForm({
            bdg_name: badge.bdg_name,
            bdg_condition: badge.bdg_condition,
            bdg_active_yn: badge.bdg_active_yn
        });
        setBadgePreview(getBadgeImageUrl(badge.bdg_icon));
        setIsEditing(true);
    };

    // 새 배지 추가 모드로 전환
    const handleAddNew = () => {
        setSelectedBadge(null);
        setBadgeForm({
            bdg_name: '',
            bdg_condition: '',
            bdg_active_yn: true
        });
        setBadgePreview('');
        setBadgeFile(null);
        setIsEditing(false);
    };

    // 폼 입력값 변경 처리
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBadgeForm({
            ...badgeForm,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // 이미지 파일 선택 처리
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 파일 형식 검증 - JPG, JPEG, PNG만 허용
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            const fileType = file.type.toLowerCase();
            
            if (!allowedTypes.includes(fileType)) {
                alert('JPG, JPEG, PNG 형식의 이미지 파일만 업로드 가능합니다.');
                e.target.value = ''; // 파일 입력 초기화
                return;
            }
            
            // 파일 크기 검증 (10MB 제한)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                alert('파일 크기는 10MB 이하만 업로드 가능합니다.');
                e.target.value = ''; // 파일 입력 초기화
                return;
            }
            
            setBadgeFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setBadgePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // 배지 저장 (추가 또는 수정)
    const handleSaveBadge = async () => {
        if (!badgeForm.bdg_name.trim()) {
            alert('배지 이름을 입력해주세요.');
            return;
        }

        if (!badgeForm.bdg_condition.trim()) {
            alert('배지 획득 조건을 입력해주세요.');
            return;
        }

        // 새 배지 등록 시에만 파일 필수 체크
        if (!badgeFile && !isEditing) {
            alert('배지 이미지를 선택해주세요.');
            return;
        }

        // 수정 모드에서 파일이 없고 기존 이미지도 없는 경우 체크
        if (!badgeFile && isEditing && !selectedBadge.bdg_icon) {
            alert('배지 이미지를 선택해주세요.');
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            console.log('handleSaveBadge - 토큰 확인:', token);
            
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            const formData = new FormData();
            
            if (isEditing && selectedBadge) {
                formData.append('bdg_idx', selectedBadge.bdg_idx);
                console.log('수정 모드 - bdg_idx:', selectedBadge.bdg_idx);
            }
            
            // 파일 처리 - 새 배지 등록 시에만 파일 필수
            if (badgeFile) {
                formData.append('file', badgeFile);
                console.log('파일 추가:', badgeFile.name);
            } else if (!isEditing) {
                // 새 배지 등록 시에는 파일이 필수이므로 에러 처리는 위에서 이미 함
                alert('새 배지 등록 시 이미지 파일이 필요합니다.');
                return;
            }

            formData.append('bdg_name', badgeForm.bdg_name);
            formData.append('bdg_condition', badgeForm.bdg_condition);
            formData.append('bdg_active_yn', badgeForm.bdg_active_yn);

            console.log('handleSaveBadge - 요청 헤더:', { 'Authorization': token });
            console.log('handleSaveBadge - FormData 내용:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            const response = await axios.post(`${API_BASE_URL}/admin/bdg/save`, formData, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('handleSaveBadge - 응답:', response.data);

            if (response.data.success) {
                alert(isEditing ? '배지가 수정되었습니다.' : '새 배지가 추가되었습니다.');
                fetchBadges(); // 목록 새로고침
                handleAddNew(); // 폼 초기화
                if (response.data.url && !isEditing) { // 새 배지 추가 성공 시 미리보기 업데이트 (선택적)
                    // setBadgePreview(response.data.url);
                }
            } else {
                alert(response.data.msg || '배지 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('배지 저장 오류:', error);
            console.error('에러 응답:', error.response?.data);
            
            if (error.response && error.response.status === 403) {
                alert('관리자 권한이 필요합니다.');
            } else {
                alert('배지 저장에 실패했습니다. 백엔드 API와 요청 형식을 확인해주세요.');
            }
        }
    };

    // 배지 블라인드 처리 (비활성화)
    const handleDeleteBadge = async () => {
        if (!selectedBadge) return;

        const actionText = selectedBadge.bdg_active_yn ? '블라인드 처리' : '활성화';
        const newStatus = !selectedBadge.bdg_active_yn;
        
        if (!confirm(`정말 "${selectedBadge.bdg_name}" 배지를 ${actionText}하시겠습니까?\n\n${selectedBadge.bdg_active_yn ? '⚠️ 사용자에게 더 이상 보이지 않습니다.' : '✅ 사용자에게 다시 보이게 됩니다.'}`)) return;

        try {
            const token = sessionStorage.getItem('token');
            console.log('handleDeleteBadge - 토큰 확인:', token);
            
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            console.log('handleDeleteBadge - 상태 변경할 배지 ID:', selectedBadge.bdg_idx);
            console.log('handleDeleteBadge - 새로운 상태:', newStatus);

            if (selectedBadge.bdg_active_yn) {
                // 활성 -> 비활성 (블라인드 처리): 기존 delete API 사용
                const requestData = { bdg_idx: selectedBadge.bdg_idx };
                
                const response = await axios.put(`${API_BASE_URL}/admin/bdg/delete`, requestData, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    alert(`"${selectedBadge.bdg_name}" 배지가 블라인드 처리되었습니다.`);
                    fetchBadges();
                    handleAddNew();
                } else {
                    alert(response.data.msg || '블라인드 처리에 실패했습니다.');
                }
            } else {
                // 비활성 -> 활성: save API 사용 (파일 없이)
                const formData = new FormData();
                formData.append('bdg_idx', selectedBadge.bdg_idx);
                formData.append('bdg_name', selectedBadge.bdg_name);
                formData.append('bdg_condition', selectedBadge.bdg_condition);
                formData.append('bdg_active_yn', true);

                const response = await axios.post(`${API_BASE_URL}/admin/bdg/save`, formData, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.data.success) {
                    alert(`"${selectedBadge.bdg_name}" 배지가 활성화되었습니다.`);
                    fetchBadges();
                    handleAddNew();
                } else {
                    alert(response.data.msg || '활성화에 실패했습니다.');
                }
            }

        } catch (error) {
            console.error('배지 상태 변경 오류:', error);
            console.error('에러 응답:', error.response?.data);
            
            if (error.response && error.response.status === 403) {
                alert('관리자 권한이 필요합니다.');
            } else {
                alert(`배지 ${actionText}에 실패했습니다. 백엔드 API와 요청 형식을 확인해주세요.`);
            }
        }
    };

    return (
        <div className="admin-badge-container">
            <h1 className="admin-badge-title">배지 관리</h1>
            
            <div className="badge-section">
                <h2 className="section-title">배지 목록</h2>
                <div className="badge-list">
                    {badges.map(badge => (
                        <div 
                            key={badge.bdg_idx} 
                            className={`badge-item ${selectedBadge?.bdg_idx === badge.bdg_idx ? 'selected' : ''} ${!badge.bdg_active_yn ? 'inactive' : ''}`}
                            onClick={() => handleSelectBadge(badge)}
                        >
                            <img 
                                src={getBadgeImageUrl(badge.bdg_icon) || '/defaultProfileImg.png'} 
                                alt={badge.bdg_name} 
                                className="badge-icon"
                                onError={(e) => { e.target.onerror = null; e.target.src='/defaultProfileImg.png'; }} // 이미지 로드 실패 시 기본 이미지
                            />
                            <div className="badge-info">
                                <p className="badge-name">{badge.bdg_name}</p>
                                <p className={`badge-status ${badge.bdg_active_yn ? 'active' : 'inactive'}`}>
                                    {badge.bdg_active_yn ? '활성' : '비활성'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="badge-edit-section">
                <h2 className="section-title">
                    {isEditing ? '배지 수정' : '새 배지 등록'}
                </h2>
                
                <div className="badge-form">
                    <div className="form-group">
                        <label htmlFor="bdg_name_input">배지 이름</label>
                        <input 
                            id="bdg_name_input"
                            type="text" 
                            name="bdg_name"
                            value={badgeForm.bdg_name}
                            onChange={handleInputChange}
                            placeholder="배지 이름 (최대 20글자)"
                            maxLength={20}
                        />
                        <div className={`char-count ${badgeForm.bdg_name.length >= 18 ? 'warning' : ''}`}>
                            {badgeForm.bdg_name.length}/20
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>배지 이미지</label>
                        <div className="badge-image-container">
                            {badgePreview ? (
                                <img 
                                    src={badgePreview} 
                                    alt="배지 이미지 미리보기" 
                                    className="badge-preview"
                                    onError={(e) => { e.target.onerror = null; e.target.style.display='none'; /* 또는 placeholder 표시 */ }}
                                />
                            ) : (
                                <div className="badge-preview-placeholder">
                                    <p>이미지 없음</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="badge-file-input"
                                id="badge-file"
                            />
                            <label htmlFor="badge-file" className="badge-file-label">
                                {isEditing && badgePreview ? '이미지 변경' : '이미지 선택'}
                            </label>
                            <div className="file-info">JPG, JPEG, PNG 형식만 가능 (최대 10MB)</div>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="bdg_condition_input">획득 조건</label>
                        <input 
                            id="bdg_condition_input"
                            type="text" 
                            name="bdg_condition"
                            value={badgeForm.bdg_condition}
                            onChange={handleInputChange}
                            placeholder="배지 획득 조건 (최대 100글자)"
                            maxLength={100}
                        />
                        <div className={`char-count ${badgeForm.bdg_condition.length >= 90 ? 'warning' : ''}`}>
                            {badgeForm.bdg_condition.length}/100
                        </div>
                    </div>
                    
                    <div className="form-group checkbox">
                        <input 
                            type="checkbox" 
                            id="bdg_active_yn_checkbox"
                            name="bdg_active_yn"
                            checked={badgeForm.bdg_active_yn}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="bdg_active_yn_checkbox">활성화</label>
                    </div>
                    
                    <div className="badge-actions">
                        <button 
                            className="btn save-btn"
                            onClick={handleSaveBadge}
                        >
                            {isEditing ? '수정' : '등록'}
                        </button>
                        
                        {isEditing && (
                            <button 
                                className="btn delete-btn"
                                onClick={handleDeleteBadge}
                            >
                                {selectedBadge?.bdg_active_yn ? '블라인드' : '활성화'}
                            </button>
                        )}
                        
                        <button 
                            className="btn cancel-btn"
                            onClick={handleAddNew} // 새 배지 추가 모드 또는 선택 취소
                        >
                            취소
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
