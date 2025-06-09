"use client"

import { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import '../admin-badge/badge.css';
import './cancer-stage.css';

export default function AdminCancerStagePage() {
    const router = useRouter();
    
    // 진단 명(암종류) 관련 상태
    const [diagnoses, setDiagnoses] = useState([]);
    const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
    const [diagnosisName, setDiagnosisName] = useState('');
    const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
    
    // 병기 관련 상태
    const [stages, setStages] = useState([]);
    const [selectedStage, setSelectedStage] = useState(null);
    const [stageName, setStageName] = useState('');
    const [isEditingStage, setIsEditingStage] = useState(false);

    useEffect(() => {
        fetchDiagnoses();
        fetchStages();
    }, []);

    // 진단 명(암종류) 관련 함수들
    const fetchDiagnoses = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            const response = await fetch('http://localhost:80/admin/cancer/list', {
                headers: {
                    'Authorization': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setDiagnoses(data.cancers || []);
                } else {
                    alert(data.msg || '진단 명 목록을 불러오는데 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('진단 명 목록을 가져오는데 실패했습니다:', error);
            alert('진단 명 목록을 불러오는데 실패했습니다.');
        }
    };

    const handleDiagnosisCardClick = (diagnosis) => {
        setSelectedDiagnosis(diagnosis);
        setDiagnosisName(diagnosis.cancer_name);
        setIsEditingDiagnosis(true);
    };

    const handleDiagnosisSubmit = async (e) => {
        e.preventDefault();
        
        if (!diagnosisName.trim()) {
            alert('진단 명을 입력해주세요.');
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            const requestData = {
                cancer_name: diagnosisName.trim()
            };

            if (selectedDiagnosis) {
                requestData.cancer_idx = selectedDiagnosis.cancer_idx;
            }

            const response = await fetch('http://localhost:80/admin/cancer/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert(selectedDiagnosis ? '진단 명이 수정되었습니다.' : '진단 명이 추가되었습니다.');
                    resetDiagnosisForm();
                    fetchDiagnoses();
                } else {
                    alert(data.msg || '진단 명 처리에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('진단 명 처리 중 오류 발생:', error);
            alert('진단 명 처리 중 오류가 발생했습니다.');
        }
    };

    const handleDiagnosisToggleBlind = async (diagnosis) => {
        if (!confirm(`정말 "${diagnosis.cancer_name}" 진단 명을 삭제하시겠습니까?`)) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            const response = await fetch(`http://localhost:80/admin/cancer/delete?cancer_idx=${diagnosis.cancer_idx}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert('진단 명이 삭제되었습니다.');
                    fetchDiagnoses();
                    if (selectedDiagnosis && selectedDiagnosis.cancer_idx === diagnosis.cancer_idx) {
                        resetDiagnosisForm();
                    }
                } else {
                    alert(data.msg || '진단 명 삭제에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('진단 명 삭제 중 오류 발생:', error);
            alert('진단 명 삭제 중 오류가 발생했습니다.');
        }
    };

    const resetDiagnosisForm = () => {
        setSelectedDiagnosis(null);
        setDiagnosisName('');
        setIsEditingDiagnosis(false);
    };

    // 병기 관련 함수들
    const fetchStages = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            const response = await fetch('http://localhost:80/admin/stage/list', {
                headers: {
                    'Authorization': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStages(data.stages || []);
                } else {
                    alert(data.msg || '병기 목록을 불러오는데 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('병기 목록을 가져오는데 실패했습니다:', error);
            alert('병기 목록을 불러오는데 실패했습니다.');
        }
    };

    const handleStageCardClick = (stage) => {
        setSelectedStage(stage);
        setStageName(stage.stage_name);
        setIsEditingStage(true);
    };

    const handleStageSubmit = async (e) => {
        e.preventDefault();
        
        if (!stageName.trim()) {
            alert('병기명을 입력해주세요.');
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            const requestData = {
                stage_name: stageName.trim()
            };

            if (selectedStage) {
                requestData.stage_idx = selectedStage.stage_idx;
            }

            const response = await fetch('http://localhost:80/admin/stage/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert(selectedStage ? '병기가 수정되었습니다.' : '병기가 추가되었습니다.');
                    resetStageForm();
                    fetchStages();
                } else {
                    alert(data.msg || '병기 처리에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('병기 처리 중 오류 발생:', error);
            alert('병기 처리 중 오류가 발생했습니다.');
        }
    };

    const handleStageToggleBlind = async (stage) => {
        if (!confirm(`정말 "${stage.stage_name}" 병기를 삭제하시겠습니까?`)) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('관리자 권한이 필요합니다. 로그인해주세요.');
                return;
            }

            const response = await fetch(`http://localhost:80/admin/stage/delete?stage_idx=${stage.stage_idx}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert('병기가 삭제되었습니다.');
                    fetchStages();
                    if (selectedStage && selectedStage.stage_idx === stage.stage_idx) {
                        resetStageForm();
                    }
                } else {
                    alert(data.msg || '병기 삭제에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('병기 삭제 중 오류 발생:', error);
            alert('병기 삭제 중 오류가 발생했습니다.');
        }
    };

    const resetStageForm = () => {
        setSelectedStage(null);
        setStageName('');
        setIsEditingStage(false);
    };

    return (
        <div className="admin-badge-container">
            <div className="admin-badge-header">
                <h1>진단 명/병기 관리</h1>
            </div>

            {/* 진단 명 섹션 */}
            <div className="section">
                <h2 className="section-title">진단 명 관리</h2>
                
                <div className="admin-badge-content">
                    <div className="badge-form-section">
                        <form onSubmit={handleDiagnosisSubmit} className="badge-form">
                            <div className="form-group">
                                <label htmlFor="diagnosisName">진단 명</label>
                                <input
                                    type="text"
                                    id="diagnosisName"
                                    value={diagnosisName}
                                    onChange={(e) => setDiagnosisName(e.target.value)}
                                    placeholder="진단 명을 입력하세요"
                                    maxLength={20}
                                    required
                                />
                                <span className={`char-count ${diagnosisName.length >= 18 ? 'warning' : ''}`}>
                                    {diagnosisName.length}/20
                                </span>
                            </div>

                            <div className="form-buttons">
                                <button type="submit" className="submit-button">
                                    {selectedDiagnosis ? '수정' : '등록'}
                                </button>
                                {isEditingDiagnosis && (
                                    <button type="button" onClick={resetDiagnosisForm} className="cancel-button">
                                        취소
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="badge-list-section">
                        <div className="list-header">
                            <h3>등록된 진단 명</h3>
                        </div>

                        {diagnoses.length === 0 ? (
                            <div className="empty-state">
                                <p>등록된 진단 명이 없습니다.</p>
                                <p>새로운 진단 명을 추가해보세요.</p>
                            </div>
                        ) : (
                            <div className="badge-grid">
                                {diagnoses.map((diagnosis) => (
                                    <div
                                        key={diagnosis.cancer_idx}
                                        className={`badge-card ${selectedDiagnosis?.cancer_idx === diagnosis.cancer_idx ? 'selected' : ''}`}
                                        onClick={() => handleDiagnosisCardClick(diagnosis)}
                                    >
                                        <div className="badge-card-content">
                                            <h4 className="badge-title">{diagnosis.cancer_name}</h4>
                                        </div>
                                        <div className="badge-actions">
                                            <button
                                                className="action-button blind"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDiagnosisToggleBlind(diagnosis);
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 병기 섹션 */}
            <div className="section">
                <h2 className="section-title">병기 관리</h2>
                
                <div className="admin-badge-content">
                    <div className="badge-form-section">
                        <form onSubmit={handleStageSubmit} className="badge-form">
                            <div className="form-group">
                                <label htmlFor="stageName">병기명</label>
                                <input
                                    type="text"
                                    id="stageName"
                                    value={stageName}
                                    onChange={(e) => setStageName(e.target.value)}
                                    placeholder="병기명을 입력하세요"
                                    maxLength={20}
                                    required
                                />
                                <span className={`char-count ${stageName.length >= 18 ? 'warning' : ''}`}>
                                    {stageName.length}/20
                                </span>
                            </div>

                            <div className="form-buttons">
                                <button type="submit" className="submit-button">
                                    {selectedStage ? '수정' : '등록'}
                                </button>
                                {isEditingStage && (
                                    <button type="button" onClick={resetStageForm} className="cancel-button">
                                        취소
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="badge-list-section">
                        <div className="list-header">
                            <h3>등록된 병기</h3>
                        </div>

                        {stages.length === 0 ? (
                            <div className="empty-state">
                                <p>등록된 병기가 없습니다.</p>
                                <p>새로운 병기를 추가해보세요.</p>
                            </div>
                        ) : (
                            <div className="badge-grid">
                                {stages.map((stage) => (
                                    <div
                                        key={stage.stage_idx}
                                        className={`badge-card ${selectedStage?.stage_idx === stage.stage_idx ? 'selected' : ''}`}
                                        onClick={() => handleStageCardClick(stage)}
                                    >
                                        <div className="badge-card-content">
                                            <h4 className="badge-title">{stage.stage_name}</h4>
                                        </div>
                                        <div className="badge-actions">
                                            <button
                                                className="action-button blind"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStageToggleBlind(stage);
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
