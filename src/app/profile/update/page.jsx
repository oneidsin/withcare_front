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
            
            // 프로필 정보 요청
            const [userRes, cancerRes, stageRes] = await Promise.all([
                axios.get(`http://localhost/profile/${id}?t=${timestamp}`, {
                    headers: { Authorization: token }
                }),
                axios.get("http://localhost/cancer"),
                axios.get("http://localhost/stage")
            ]);

            console.log("프로필 API 응답:", userRes.data);
            console.log("세션에 저장된 이름:", storedName);
            
            if (userRes.data.status === "success") {
                const userData = userRes.data.data;
                console.log("서버에서 받은 프로필 데이터:", userData);
                
                // 서버 데이터와 세션 스토리지를 조합하여 폼 데이터 설정
                const formData = {
                    id: id,
                    name: userData.name || storedName || "",
                    year: userData.year || "",
                    gender: userData.gender || "",
                    email: userData.email || "",
                    cancer_idx: userData.cancer_idx || "",
                    stage_idx: userData.stage_idx || "",
                    profile_yn: userData.profile_yn ? "Y" : "N",
                    intro: userData.intro || "",
                    profile_photo: userData.profile_photo || ""
                };
                
                console.log("폼에 표시할 데이터:", formData);
                
                // 폼 상태 업데이트
                setInfo(formData);
                
                // 프로필 이미지가 있으면 미리보기 설정
                if (userData.profile_photo) {
                    setPreviewImage(getValidImageUrl(userData.profile_photo));
                }
            }

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
            if (storedName) {
                setInfo(prev => ({
                    ...prev,
                    id: id,
                    name: storedName
                }));
            }
            alert("일부 프로필 정보를 불러오는데 실패했습니다.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
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
            // 데이터 유효성 검사
            if (!info.id || !info.name) {
                alert("이름은 필수 항목입니다.");
                return;
            }

            console.log("프로필 수정 시작");
            console.log("이미지 변경 여부:", !!profileImage);

            // 먼저 이미지 업로드 처리 (이미지가 있는 경우)
            let imageUrl = info.profile_photo;
            if (profileImage) {
                console.log("이미지 업로드 시작:", profileImage.name);
                
                const imageFormData = new FormData();
                imageFormData.append("file", profileImage);
                
                try {
                    const imageRes = await axios.post(
                        'http://localhost/profile/upload',
                        imageFormData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                                'Authorization': token
                            }
                        }
                    );
                    
                    console.log("이미지 업로드 응답:", imageRes.data);
                    
                    if (imageRes.data.status === "success") {
                        imageUrl = imageRes.data.url;
                        console.log("업로드된 이미지 URL:", imageUrl);
                    } else {
                        throw new Error(imageRes.data.message || "이미지 업로드에 실패했습니다.");
                    }
                } catch (uploadError) {
                    console.error("이미지 업로드 실패:", uploadError);
                    
                    // JWT 토큰 에러 처리
                    if (uploadError.response && uploadError.response.status === 401) {
                        alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                        sessionStorage.clear();
                        router.push("/login");
                        return;
                    }
                    
                    alert("이미지 업로드에 실패했습니다. 프로필 정보만 수정됩니다.");
                }
            }

            // 프로필 정보 업데이트 (이미지 URL 포함)
            const profileData = {
                id: info.id,
                name: info.name,
                email: info.email || "",
                year: parseInt(info.year) || 0,
                gender: info.gender || "",
                cancer_idx: info.cancer_idx ? parseInt(info.cancer_idx) : 0,
                stage_idx: info.stage_idx ? parseInt(info.stage_idx) : 0,
                profile_yn: info.profile_yn === "Y",
                intro: info.intro || "",
                profile_photo: imageUrl  // 업로드된 이미지 URL 또는 기존 이미지 URL
            };

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

            // 프로필 업데이트 요청
            
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
                
                // 이미지 URL을 세션 스토리지에 저장 (필요한 경우)
                if (imageUrl) {
                    sessionStorage.setItem("profilePic", getValidImageUrl(imageUrl));
                }
                
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
        
        // 그 외의 경우 백엔드 기본 URL에 경로 추가
        return `http://localhost/${url}`;
    };

    return (
        <div className="update-container">
            <h2>프로필 수정</h2>
            <form onSubmit={handleSubmit} className="update-form">
                <div className="form-group">
                    <label>프로필 사진</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {previewImage && (
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
                        required
                    />
                </div>

                <div className="form-group">
                    <label>출생연도</label>
                    <input
                        type="text"
                        name="year"
                        value={info.year}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>성별</label>
                    <select name="gender" value={info.gender} onChange={handleChange} required>
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
                        required
                    />
                </div>

                <div className="form-group">
                    <label>암 종류</label>
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
                    <label>병기</label>
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
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label>프로필 공개 여부</label>
                    <select name="profile_yn" value={info.profile_yn} onChange={handleChange}>
                        <option value="Y">공개</option>
                        <option value="N">비공개</option>
                    </select>
                </div>

                <div className="button-group">
                    <button type="submit">수정하기</button>
                    <button type="button" onClick={() => router.push("/profile")}>취소</button>
                </div>
            </form>
        </div>
    );
}
