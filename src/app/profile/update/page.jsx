"use client";

import React, { useEffect, useState } from "react";
import "./update.css";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function UpdatePage() {
    const router = useRouter();
    const [info, setInfo] = useState({
        id: "",
        name: "",
        year: "",
        gender: "",
        email: "",
        cancer_idx: "",
        stage_idx: "",
        profile_yn: "Y",
        intro: "",
        profile_photo: ""
    });

    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [cancerList, setCancerList] = useState([]);
    const [stageList, setStageList] = useState([]);
    const [isImageDeleted, setIsImageDeleted] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const id = sessionStorage.getItem("id");

        if (!token || !id) {
            alert("로그인이 필요합니다.");
            router.push("/login");
            return;
        }
    
        // 데이터 가져오기
        fetchData(id, token);
    }, []);

    // 데이터 가져오기 함수
    const fetchData = async (id, token) => {
        try {
            console.log("프로필 정보 가져오기 시작...");
            
            // 캐시 방지를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            const storedName = sessionStorage.getItem("name");
            
            // 회원가입 시 저장한 기본 정보 가져오기 (fallback용)
            const signupName = sessionStorage.getItem("signupName");
            const signupGender = sessionStorage.getItem("signupGender");
            const signupYear = sessionStorage.getItem("signupYear");
            const signupEmail = sessionStorage.getItem("signupEmail");
            
            // 프로필 정보와 선택 옵션 데이터를 병렬로 요청
            const requests = [
                axios.get(`http://localhost/profile/${id}?t=${timestamp}`, {
                    headers: { Authorization: token }
                }),
                axios.get("http://localhost/cancer").catch(err => {
                    console.error("암 종류 API 호출 실패:", err);
                    return { data: [] };
                }),
                axios.get("http://localhost/stage").catch(err => {
                    console.error("병기 API 호출 실패:", err);
                    return { data: [] };
                })
            ];
            
            const [userRes, cancerRes, stageRes] = await Promise.all(requests);

            console.log("프로필 API 응답:", userRes.data);
            console.log("세션에 저장된 이름:", storedName);
            
            if (userRes.data.status === "success") {
                const userData = userRes.data.data;
                console.log("서버에서 받은 프로필 데이터:", userData);
                console.log("서버에서 받은 gender 값:", userData.gender);
                console.log("서버 gender 타입:", typeof userData.gender);
                console.log("서버 gender === null:", userData.gender === null);
                console.log("서버 gender === '':", userData.gender === "");
                console.log("세션에 저장된 gender 값:", signupGender);
                console.log("세션 gender 타입:", typeof signupGender);
                
                // 서버 데이터와 세션 스토리지를 조합하여 폼 데이터 설정
                const formData = {
                    id: id,
                    name: userData.name || storedName || signupName || "",
                    year: userData.year || signupYear || "",
                    gender: (() => {
                        // gender 값 우선순위: 서버 데이터 > 세션 스토리지 > 빈 문자열
                        if (userData.gender && userData.gender !== null && userData.gender !== "" && userData.gender !== "null") {
                            console.log("서버 gender 값 사용:", userData.gender);
                            return userData.gender;
                        } else if (signupGender && signupGender !== null && signupGender !== "" && signupGender !== "null") {
                            console.log("세션 gender 값 사용:", signupGender);
                            return signupGender;
                        } else {
                            console.log("gender 값 없음, 빈 문자열 사용");
                            return "";
                        }
                    })(),
                    email: userData.email || signupEmail || "",
                    cancer_idx: userData.cancer_idx || "",
                    stage_idx: userData.stage_idx || "",
                    profile_yn: userData.profile_yn ? "Y" : "N",
                    intro: userData.intro || "",
                    profile_photo: userData.profile_photo || ""
                };
                
                console.log("폼에 표시할 데이터:", formData);
                console.log("최종 gender 값:", formData.gender);
                
                // 폼 상태 업데이트
                setInfo(formData);
                
                // 프로필 이미지가 있으면 미리보기 설정
                if (userData.profile_photo) {
                    setPreviewImage(getValidImageUrl(userData.profile_photo));
                }
            } else {
                // 프로필 정보를 가져올 수 없는 경우 기본 정보라도 설정
                const basicInfo = {
                    id: id,
                    name: storedName || signupName || "",
                    year: signupYear || "",
                    gender: signupGender || "",
                    email: signupEmail || "",
                    cancer_idx: "",
                    stage_idx: "",
                    profile_yn: "Y",
                    intro: "",
                    profile_photo: ""
                };
                setInfo(basicInfo);
                console.warn("프로필 정보 로딩 실패, 기본 정보 사용");
            }

            // 선택 옵션 설정 (실패해도 빈 배열로 설정)
            setCancerList(cancerRes.data || []);
            setStageList(stageRes.data || []);
            
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
            
            // JWT 토큰 에러 처리
            if (error.response) {
                console.error("오류 응답:", error.response.data);
                console.error("오류 상태:", error.response.status);
                
                if (error.response.status === 401 || 
                    (error.response.data && error.response.data.message && 
                     error.response.data.message.includes("JWT"))) {
                    alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                    sessionStorage.clear();
                    router.push("/login");
                    return;
                }
            }
            
            // 오류가 발생해도 세션 스토리지의 기본 정보는 표시
            const storedName = sessionStorage.getItem("name");
            const basicInfo = {
                id: id,
                name: storedName || signupName || "",
                year: signupYear || "",
                gender: signupGender || "",
                email: signupEmail || "",
                cancer_idx: "",
                stage_idx: "",
                profile_yn: "Y",
                intro: "",
                profile_photo: ""
            };
            setInfo(basicInfo);
            
            // 선택 옵션은 빈 배열로 설정
            setCancerList([]);
            setStageList([]);
            
            alert("일부 프로필 정보를 불러오는데 실패했습니다. 기본 정보로 진행합니다.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // 글자 수 제한 적용
        let limitedValue = value;
        switch (name) {
            case 'name':
                limitedValue = value.slice(0, 50);
                break;
            case 'year':
                // 숫자만 허용하고 4글자 제한
                limitedValue = value.replace(/[^0-9]/g, '').slice(0, 4);
                break;
            case 'email':
                limitedValue = value.slice(0, 50);
                break;
            case 'intro':
                limitedValue = value.slice(0, 5000);
                break;
        }
        
        setInfo(prev => ({
            ...prev,
            [name]: limitedValue
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 파일 형식 검증 - MIME 타입과 파일 확장자 모두 확인
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            const fileType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();
            const fileExtension = fileName.split('.').pop();
            
            console.log('선택된 파일 정보:', {
                name: file.name,
                type: file.type,
                size: file.size,
                extension: fileExtension
            });
            
            if (!allowedTypes.includes(fileType) || !['jpg', 'jpeg', 'png'].includes(fileExtension)) {
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
            
            // 이미지 파일인지 추가 검증
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            img.onload = function() {
                // URL 해제 (메모리 누수 방지)
                URL.revokeObjectURL(objectUrl);
                
                console.log('이미지 검증 성공:', {
                    width: this.width,
                    height: this.height
                });
                
                // 검증 성공 시에만 파일 설정
                setProfileImage(file);
                setIsImageDeleted(false);
                
                // FileReader로 미리보기 생성
                const reader = new FileReader();
                reader.onload = function(event) {
                    console.log('이미지 읽기 완료');
                    setPreviewImage(event.target.result);
                };
                reader.onerror = function(error) {
                    console.error('이미지 읽기 실패:', error);
                    alert('이미지를 읽는데 실패했습니다. 다른 이미지를 선택해주세요.');
                    e.target.value = '';
                };
                reader.readAsDataURL(file);
            };
            
            img.onerror = function() {
                // URL 해제 (메모리 누수 방지)
                URL.revokeObjectURL(objectUrl);
                console.error('유효하지 않은 이미지 파일');
                alert('유효하지 않은 이미지 파일입니다. 다른 파일을 선택해주세요.');
                e.target.value = '';
            };
            
            // 이미지 로드 시작
            img.src = objectUrl;
            
        } else {
            // 파일 선택이 취소된 경우
            console.log('파일 선택 취소됨');
        }
    };

    const handleImageDelete = () => {
        if (window.confirm('프로필 이미지를 삭제하시겠습니까?\n기본 이미지로 변경됩니다.')) {
            setProfileImage(null);
            setPreviewImage("/defaultProfileImg.png");
            setIsImageDeleted(true);
            
            // 파일 입력 초기화
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.value = '';
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = sessionStorage.getItem("token");
        
        if (!token) {
            alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
            sessionStorage.clear();
            router.push("/login");
            return;
        }
        
        try {
            // 데이터 유효성 검사 - 필수 항목만 체크
            if (!info.id || !info.name || !info.year) {
                alert("아이디, 이름, 출생연도는 필수 항목입니다.");
                return;
            }

            console.log("프로필 수정 시작");
            console.log("이미지 변경 여부:", !!profileImage);

            // 프로필 정보 준비
            const profileData = {
                id: info.id,
                name: info.name,
                email: info.email || "",
                year: parseInt(info.year) || 0,
                gender: info.gender || "",
                profile_yn: info.profile_yn === "Y",
                intro: info.intro || "",
                profile_photo: isImageDeleted ? "" : info.profile_photo
            };

            // cancer_idx와 stage_idx는 유효한 값이 있을 때만 추가
            if (info.cancer_idx && info.cancer_idx !== "" && parseInt(info.cancer_idx) > 0) {
                profileData.cancer_idx = parseInt(info.cancer_idx);
            }
            
            if (info.stage_idx && info.stage_idx !== "" && parseInt(info.stage_idx) > 0) {
                profileData.stage_idx = parseInt(info.stage_idx);
            }

            console.log("프로필 수정 요청 데이터:", profileData);

            // FormData 생성
            const formData = new FormData();
            
            // 백엔드에서 기대하는 형식으로 데이터 추가
            // info 파라미터에 JSON 문자열로 변환된 profileData 추가
            formData.append("info", new Blob([JSON.stringify(profileData)], {
                type: "application/json"
            }));
            
            // 이미지가 있으면 profile_image 파라미터로 추가
            if (profileImage) {
                formData.append("profile_image", profileImage);
            }
            
            console.log("FormData 생성 완료");

            // 프로필 업데이트 요청 - PUT 메소드 사용
            const response = await fetch('http://localhost/profile/update', {
                method: 'PUT',
                headers: {
                    'Authorization': token
                },
                body: formData
            });
        
            if (!response.ok) {
                let errorMessage = `프로필 수정에 실패했습니다. (${response.status})`;
                
                // 401 Unauthorized 처리
                if (response.status === 401) {
                    alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                    sessionStorage.clear();
                    router.push("/login");
                    return;
                }
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // JSON 파싱 실패 시 기본 메시지 사용
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            if (data.status === "success") {
                // 서버에서 받은 데이터 처리
                console.log("프로필 업데이트 성공 응답:", data);
                
                // 세션 스토리지 업데이트
                sessionStorage.setItem("name", info.name);
                
                // 이미지 URL을 세션 스토리지에 저장/삭제 처리
                if (isImageDeleted) {
                    // 이미지가 삭제된 경우 세션 스토리지에서도 제거
                    sessionStorage.removeItem("profilePic");
                    console.log("세션 스토리지에서 프로필 이미지 삭제됨");
                } else if (data.data && data.data.profile_photo) {
                    // 서버에서 받은 새 이미지 URL이 있는 경우
                    sessionStorage.setItem("profilePic", getValidImageUrl(data.data.profile_photo));
                    console.log("세션 스토리지 프로필 이미지 업데이트:", data.data.profile_photo);
                } else if (profileData.profile_photo) {
                    // 기존 이미지 URL 유지
                    sessionStorage.setItem("profilePic", getValidImageUrl(profileData.profile_photo));
                }
                
                // 프로필 업데이트 커스텀 이벤트 발생 - 다른 컴포넌트에 알림
                window.dispatchEvent(new Event('profileUpdated'));
                
                // 세션 스토리지 변경 이벤트도 수동으로 발생시켜 사이드바 즉시 업데이트
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'profilePic',
                    newValue: isImageDeleted ? null : (data.data && data.data.profile_photo ? getValidImageUrl(data.data.profile_photo) : profileData.profile_photo),
                    storageArea: sessionStorage
                }));
                
                alert(`프로필이 성공적으로 수정되었습니다.\n이름: ${info.name}`);
                
                // 페이지 새로고침을 위해 window.location 사용
                window.location.href = "/profile";
            } else {
                throw new Error(data.message || "프로필 수정에 실패했습니다.");
            }
        } catch (error) {
            console.error("프로필 수정 실패:", error);
            
            // JWT 토큰 에러 처리
            if (error.response && error.response.status === 401) {
                alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                sessionStorage.clear();
                router.push("/login");
                return;
            }
            
            alert(error.message || "프로필 수정 중 오류가 발생했습니다.");
        }
    };

    // 회원탈퇴 함수
    const handleWithdraw = async () => {
        const token = sessionStorage.getItem("token");
        const id = sessionStorage.getItem("id");
        
        if (!token || !id) {
            alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
            sessionStorage.clear();
            router.push("/login");
            return;
        }

        // 탈퇴 확인
        const confirmMessage = `정말로 회원탈퇴를 하시겠습니까?\n\n탈퇴 후에는 계정 복구가 어려울 수 있습니다.\n계속 진행하시려면 확인을 클릭하세요.`;
        
        if (!window.confirm(confirmMessage)) {
            return;
        }

        // 추가 확인
        const finalConfirm = `마지막 확인입니다.\n\n회원ID: ${id}\n정말로 탈퇴하시겠습니까?`;
        
        if (!window.confirm(finalConfirm)) {
            return;
        }

        try {
            console.log("회원탈퇴 요청 시작:", id);

            const response = await fetch(`http://localhost/delete/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = `회원탈퇴에 실패했습니다. (${response.status})`;
                
                if (response.status === 401) {
                    alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                    sessionStorage.clear();
                    router.push("/login");
                    return;
                }
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.msg || errorMessage;
                } catch (e) {
                    // JSON 파싱 실패 시 기본 메시지 사용
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (data.success) {
                alert("회원탈퇴가 완료되었습니다.\n그동안 이용해주셔서 감사합니다.");
                
                // 모든 세션 데이터 삭제
                sessionStorage.clear();
                
                // 로그아웃 상태 업데이트를 위한 이벤트 발생
                window.dispatchEvent(new Event('logout'));
                
                // 메인 페이지로 이동
                location.href = "/";
            } else {
                throw new Error(data.msg || "회원탈퇴에 실패했습니다.");
            }
        } catch (error) {
            console.error("회원탈퇴 실패:", error);
            
            if (error.response && error.response.status === 401) {
                alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                sessionStorage.clear();
                router.push("/login");
                return;
            }
            
            alert(error.message || "회원탈퇴 중 오류가 발생했습니다.");
        }
    };

    // 유효한 이미지 URL 생성 함수
    const getValidImageUrl = (url) => {
        if (!url || url === 'null' || url === 'undefined') {
            return "/defaultProfileImg.png";
        }
        
        // URL이 이미 http://로 시작하는지 확인
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // URL이 /로 시작하는지 확인 (절대 경로)
        if (url.startsWith('/')) {
            return `http://localhost${url}`;
        }
        
        // profile/ 경로로 시작하는 경우 file/ 접두사 추가
        if (url.startsWith('profile/')) {
            return `http://localhost/file/${url}`;
        }
        
        // 그 외의 경우 백엔드 기본 URL에 경로 추가
        return `http://localhost/${url}`;
    };

    // 글자 수 카운터 클래스 생성 함수
    const getCharCountClass = (current, limit) => {
        const percentage = (current / limit) * 100;
        if (percentage >= 100) return 'char-count limit-exceeded';
        if (percentage >= 80) return 'char-count limit-warning';
        return 'char-count';
    };

    return (
        <div className="update-container">
            <h2>프로필 수정</h2>
            <form onSubmit={handleSubmit} className="update-form">
                <div className="form-group">
                    <label>프로필 사진</label>
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                        onChange={handleImageChange}
                        capture="environment"
                        style={{ width: '100%' }}
                    />
                    <div className="file-info">JPG, JPEG, PNG 형식만 가능 (최대 10MB)</div>
                    {previewImage && (
                        <div className="image-preview-container">
                            <img
                                src={previewImage}
                                alt="Profile preview"
                                className="profile-preview"
                                onError={(e) => { 
                                    console.log("이미지 로드 실패, 기본 이미지로 대체:", e.target.src);
                                    e.target.onerror = null; 
                                    e.target.src = "/defaultProfileImg.png"; 
                                }}
                            />
                            <button 
                                type="button" 
                                className="delete-image-btn" 
                                onClick={handleImageDelete}
                                title="이미지 삭제"
                            >
                                ✕ 이미지 삭제
                            </button>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>아이디</label>
                    <input
                        type="text"
                        name="id"
                        value={info.id}
                        disabled
                    />
                </div>

                <div className="form-group">
                    <label>이름</label>
                    <input
                        type="text"
                        name="name"
                        value={info.name}
                        onChange={handleChange}
                        maxLength={50}
                        required
                    />
                    <div className={getCharCountClass(info.name.length, 50)}>{info.name.length}/50</div>
                </div>

                <div className="form-group">
                    <label>출생연도</label>
                    <input
                        type="text"
                        name="year"
                        value={info.year}
                        onChange={handleChange}
                        maxLength={4}
                        placeholder="예: 1990"
                        required
                    />
                    <div className={getCharCountClass(info.year.length, 4)}>{info.year.length}/4</div>
                </div>

                <div className="form-group">
                    <label>성별</label>
                    <select name="gender" value={info.gender} onChange={handleChange}>
                        <option value="">선택하세요</option>
                        <option value="M">남성</option>
                        <option value="F">여성</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>이메일</label>
                    <input
                        type="email"
                        name="email"
                        value={info.email}
                        onChange={handleChange}
                        maxLength={50}
                    />
                    <div className={getCharCountClass(info.email.length, 50)}>{info.email.length}/50</div>
                </div>

                <div className="form-group">
                    <label>암 종류 (선택사항)</label>
                    <select
                        name="cancer_idx"
                        value={info.cancer_idx || ""}
                        onChange={handleChange}
                    >
                        <option value="">선택하세요</option>
                        {cancerList.map(cancer => (
                            <option key={cancer.cancer_idx} value={cancer.cancer_idx}>
                                {cancer.cancer_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>병기 (선택사항)</label>
                    <select
                        name="stage_idx"
                        value={info.stage_idx || ""}
                        onChange={handleChange}
                    >
                        <option value="">선택하세요</option>
                        {stageList.map(stage => (
                            <option key={stage.stage_idx} value={stage.stage_idx}>
                                {stage.stage_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>소개글</label>
                    <textarea
                        name="intro"
                        value={info.intro}
                        onChange={handleChange}
                        maxLength={5000}
                        rows="4"
                    />
                    <div className={getCharCountClass(info.intro.length, 5000)}>{info.intro.length}/5000</div>
                </div>

                <div className="form-group">
                    <label>프로필 공개 여부</label>
                    <select name="profile_yn" value={info.profile_yn} onChange={handleChange}>
                        <option value="Y">공개 - 다른 사용자들이 내 프로필을 볼 수 있습니다</option>
                        <option value="N">비공개 - 다른 사용자들이 내 프로필을 볼 수 없습니다</option>
                    </select>
                    <div className="form-help">
                        {info.profile_yn === "N" ? (
                            <span style={{color: '#ff6b6b', fontSize: '13px'}}>
                                ⚠️ 비공개 설정 시 다른 사용자들이 회원님의 프로필, 배지, 타임라인, 레벨 정보를 볼 수 없습니다.
                            </span>
                        ) : (
                            <span style={{color: '#4CAF50', fontSize: '13px'}}>
                                ✅ 공개 설정 시 다른 사용자들이 회원님의 프로필 정보를 볼 수 있습니다.
                            </span>
                        )}
                    </div>
                </div>

                <div className="button-group">
                    <button type="submit">수정하기</button>
                    <button type="button" onClick={() => router.push("/profile")}>취소</button>
                </div>
                
                <div className="button-group">
                    <button type="button" className="withdraw-btn" onClick={handleWithdraw}>
                        회원탈퇴
                    </button>
                </div>
            </form>
        </div>
    );
}
