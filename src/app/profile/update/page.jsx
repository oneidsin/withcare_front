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
        const fetchData = async () => {
            try {
                const [userRes, cancerRes, stageRes] = await Promise.all([
                    axios.get(`http://localhost/profile/${id}`, {
                        headers: { Authorization: token }
                    }),
                    axios.get("http://localhost/cancer"),
                    axios.get("http://localhost/stage")
                ]);

                if (userRes.data.status === "success") {
                    const userData = userRes.data.data;
                    setInfo({
                        id: userData.id || "",
                        name: userData.name || "",
                        year: userData.year || "",
                        gender: userData.gender || "",
                        email: userData.email || "",
                        cancer_idx: userData.cancer_idx || "",
                        stage_idx: userData.stage_idx || "",
                        profile_yn: userData.profile_yn ? "Y" : "N",
                        intro: userData.intro || "",
                        profile_photo: userData.profile_photo || ""
                    });
                    if (userData.profile_photo) {
                        setPreviewImage(userData.profile_photo);
                    }
                }

                setCancerList(cancerRes.data || []);
                setStageList(stageRes.data || []);
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
                alert("프로필 정보를 불러오는데 실패했습니다.");
            }
        };

        fetchData();
    }, []);

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
        
        try {
            // 데이터 유효성 검사
            if (!info.id || !info.name || !info.email) {
                alert("필수 항목을 모두 입력해주세요.");
                return;
            }

            // 프로필 이미지 업로드
            let imageUrl = info.profile_photo;
            if (profileImage) {
                const formData = new FormData();
                formData.append("file", profileImage);
                try {
                    const imageRes = await axios({
                        method: 'post',
                        url: 'http://localhost/profile/upload',
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': token
                        },
                        data: formData
                    });

                    if (imageRes.data.status === "success") {
                        imageUrl = imageRes.data.url;
                    } else {
                        throw new Error(imageRes.data.message || "이미지 업로드에 실패했습니다.");
                    }
                } catch (uploadError) {
                    console.error("이미지 업로드 실패:", uploadError);
                    if (uploadError.response && uploadError.response.data) {
                        alert(uploadError.response.data.message || "이미지 업로드에 실패했습니다.");
                    } else {
                        alert("이미지 업로드에 실패했습니다. 프로필 정보만 수정됩니다.");
                    }
                }
            }

            // 프로필 정보 업데이트
            const updateData = {
                ...info,
                profile_photo: imageUrl,
                cancer_idx: info.cancer_idx ? parseInt(info.cancer_idx) : null,
                stage_idx: info.stage_idx ? parseInt(info.stage_idx) : null,
                profile_yn: info.profile_yn === "Y"
            };

            console.log("프로필 수정 요청 데이터:", updateData);

            const updateRes = await axios({
                method: 'put',
                url: 'http://localhost/profile/update',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                data: updateData
            });

            if (updateRes.data.status === "success") {
                alert("프로필이 성공적으로 수정되었습니다.");
                router.push("/profile");
            } else {
                throw new Error(updateRes.data.message || "프로필 수정에 실패했습니다.");
            }
        } catch (error) {
            console.error("프로필 수정 실패:", error);
            if (error.response && error.response.data) {
                const errorMessage = error.response.data.message || error.response.data.error || "프로필 수정 중 오류가 발생했습니다.";
                alert(errorMessage);
            } else if (error.request) {
                alert("서버와의 통신에 실패했습니다. 네트워크 연결을 확인해주세요.");
            } else {
                alert(error.message || "프로필 수정 중 오류가 발생했습니다.");
            }
        }
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
