'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import './level.css';

export default function LevelManagePage() {
    const [levels, setLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editIdx, setEditIdx] = useState(null);
    const [form, setForm] = useState({
        lv_idx: null,
        lv_no: '',
        lv_name: '',
        post_cnt: '',
        com_cnt: '',
        like_cnt: '',
        time_cnt: '',
        access_cnt: '',
        file: null
    });
    const [showForm, setShowForm] = useState(false);
    const [filePreview, setFilePreview] = useState(null);

    const fetchLevels = async () => {
        try {
            setIsLoading(true);
            const token = sessionStorage.getItem('token');
            console.log('Fetching levels with token:', token);

            // 레벨 목록 조회
            const res = await axios.get('http://localhost:80/admin/level', {
                headers: { Authorization: token }
            });

            console.log('Level response:', res.data);

            if (res.data && Array.isArray(res.data)) {
                setLevels(res.data);
            } else if (res.data && res.data.result && Array.isArray(res.data.result)) {
                setLevels(res.data.result);
            } else {
                console.error('Invalid level data format:', res.data);
                setLevels([]);
            }
        } catch (error) {
            console.error('Error fetching levels:', error);
            if (error.response && error.response.status === 403) {
                alert('관리자 권한이 필요합니다.');
            } else {
                alert('레벨 목록을 불러오는데 실패했습니다.');
            }
            setLevels([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({ ...prev, file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        if (!form.lv_no || !form.lv_name) {
            alert('레벨 번호와 이름은 필수입니다.');
            return false;
        }
        if (isNaN(form.lv_no) || form.lv_no < 0) {
            alert('레벨 번호는 0 이상의 숫자여야 합니다.');
            return false;
        }
        if (isNaN(form.post_cnt) || isNaN(form.com_cnt) || isNaN(form.like_cnt) || 
            isNaN(form.time_cnt) || isNaN(form.access_cnt) ||
            form.post_cnt < 0 || form.com_cnt < 0 || form.like_cnt < 0 || 
            form.time_cnt < 0 || form.access_cnt < 0) {
            alert('조건값은 0 이상의 숫자여야 합니다.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const token = sessionStorage.getItem('token');
            const data = new FormData();

            if (form.lv_idx) data.append('lv_idx', form.lv_idx);

            // Convert string values to numbers
            data.append('lv_no', parseInt(form.lv_no));
            data.append('lv_name', form.lv_name);
            data.append('post_cnt', parseInt(form.post_cnt));
            data.append('com_cnt', parseInt(form.com_cnt));
            data.append('like_cnt', parseInt(form.like_cnt));
            data.append('time_cnt', parseInt(form.time_cnt));
            data.append('access_cnt', parseInt(form.access_cnt));
            
            // 파일 업로드 디버깅
            if (form.file) {
                console.log('File type:', form.file.type);
                console.log('File name:', form.file.name);
                console.log('File size:', form.file.size);
                data.append('file', form.file);
            }

            console.log('Sending request to server...');
            const res = await axios.post('http://localhost:80/admin/level/save', data, {
                headers: {
                    Authorization: token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Server response:', res.data);

            if (res.data.success) {
                alert('저장 완료');
                setForm({ lv_idx: null, lv_no: '', lv_name: '', post_cnt: '', com_cnt: '', like_cnt: '', time_cnt: '', access_cnt: '', file: null });
                setFilePreview(null);
                setShowForm(false);
                fetchLevels();
            } else {
                alert(res.data.msg || '저장 실패');
            }
        } catch (error) {
            console.error('Save error:', error);
            console.error('Error response:', error.response?.data);
            alert('저장 중 오류가 발생했습니다: ' + (error.response?.data?.msg || error.message));
        }
    };

    const handleDelete = async (lv_idx, url) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.delete('http://localhost:80/admin/level/delete', {
                headers: { Authorization: token },
                params: { lv_idx, url }
            });
            
            if (res.data.success) {
                alert('삭제 완료');
                fetchLevels();
            } else {
                alert(res.data.msg || '삭제 실패');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="level-container">
            <div className="level-title">레벨 설정</div>

            {showForm && (
                <div className="level-form">
                    <h3>{form.lv_idx ? '레벨 수정' : '새 레벨 추가'}</h3>
                    <div className="form-group">
                        <label>레벨 번호</label>
                        <input
                            type="text"
                            name="lv_no"
                            value={form.lv_no}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자 외 입력 자동 제거
                                if (value.length <= 6) {
                                    setForm(prev => ({ ...prev, lv_no: value }));
                                }
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>레벨 이름</label>
                        <input
                            type="text"
                            name="lv_name"
                            value={form.lv_name}
                            onChange={handleFormChange}
                            maxLength={20}
                        />
                    </div>
                    <div className="form-group">
                        <label>게시글 수</label>
                        <input
                            type="text"
                            name="post_cnt"
                            value={form.post_cnt}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 10) {
                                    setForm(prev => ({ ...prev, post_cnt: value }));
                                }
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>댓글 수</label>
                        <input
                            type="text"
                            name="com_cnt"
                            value={form.com_cnt}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 10) {
                                    setForm(prev => ({ ...prev, com_cnt: value }));
                                }
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>추천 받은 수</label>
                        <input
                            type="text"
                            name="like_cnt"
                            value={form.like_cnt}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 10) {
                                    setForm(prev => ({ ...prev, like_cnt: value }));
                                }
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>타임라인 수</label>
                        <input
                            type="text"
                            name="time_cnt"
                            value={form.time_cnt}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 10) {
                                    setForm(prev => ({ ...prev, time_cnt: value }));
                                }
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>방문 횟수</label>
                        <input
                            type="text"
                            name="access_cnt"
                            value={form.access_cnt}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 10) {
                                    setForm(prev => ({ ...prev, access_cnt: value }));
                                }
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>레벨 아이콘 {form.lv_idx ? '(선택사항)' : '(필수)'}</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {filePreview && (
                            <img src={filePreview} alt="Preview" className="icon-preview" />
                        )}
                        {form.lv_idx && !filePreview && form.lv_icon && (
                            <img src={form.lv_icon} alt="Current icon" className="icon-preview" />
                        )}
                    </div>
                    <div className="form-actions">
                        <button onClick={handleSubmit} className="level-button">저장</button>
                        <button onClick={() => {
                            setShowForm(false);
                            setForm({ lv_idx: null, lv_no: '', lv_name: '', post_cnt: '', com_cnt: '', like_cnt: '', time_cnt: '', access_cnt: '', file: null });
                            setFilePreview(null);
                        }} className="level-button cancel">취소</button>
                    </div>
                </div>
            )}

            <div className="level-list">
                {isLoading ? (
                    <div className="loading">로딩 중...</div>
                ) : levels.length === 0 ? (
                    <div className="no-data">등록된 레벨이 없습니다.</div>
                ) : (
                    levels.map((lv, idx) => (
                        <div className="level-card" key={lv.lv_idx}>
                            <img src={lv.lv_icon} alt="icon" className="level-icon" />
                            <div className="level-header">
                                Levels {lv.lv_no} <span>{lv.lv_name}</span>
                            </div>
                            <div className="level-info">
                                게시글 {lv.post_cnt}/{lv.post_cnt}<br />
                                댓글 {lv.com_cnt}/{lv.com_cnt}<br />
                                추천 받은 수 {lv.like_cnt}/{lv.like_cnt}<br />
                                타임라인 수 {lv.time_cnt}/{lv.time_cnt}<br />
                                방문 횟수 {lv.access_cnt}/{lv.access_cnt}
                            </div>
                            <div className="level-actions">
                                <button className="level-button" onClick={() => {
                                    setForm({ ...lv, file: null });
                                    setShowForm(true);
                                }}>수정</button>
                                <button className="level-button delete" onClick={() => handleDelete(lv.lv_idx, lv.lv_icon)}>삭제</button>
                            </div>
                        </div>
                    ))
                )}

                <div className="level-add-button" onClick={() => {
                    setForm({ lv_idx: null, lv_no: '', lv_name: '', post_cnt: '', com_cnt: '', like_cnt: '', time_cnt: '', access_cnt: '', file: null });
                    setShowForm(true);
                }}>+</div>
            </div>
        </div>
    );
}
