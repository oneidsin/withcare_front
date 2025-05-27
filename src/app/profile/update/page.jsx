"use client";

import "../../login/login.css";
import { useEffect, useState } from "react";
import axios from "axios";

export default function UpdatePage() {
    const [info, setInfo] = useState({
        name: '',
        year: '',
        gender: '',
        email: '',
        cancer: null,
        stage: null,
        profile_yn: 'Y',
        intro: ''
    });

    const [profileImage, setProfileImage] = useState(null); // 프로필 사진
    const [cancerList, setCancerList] = useState([]);
    const [stageList, setStageList] = useState([]);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const res = await axios.get("http://localhost/profile/{id}");
                const data = res.data;
                setInfo({
                    name: data.name || '',
                    year: data.year || '',
                    gender: data.gender || '',
                    email: data.email || '',
                    cancer: data.cancer ?? null,
                    stage: data.stage ?? null,
                    profile_yn: data.profile_yn || 'Y',
                    intro: data.intro || ''
                });
            } catch (err) {
                console.error("유저 정보 로딩 실패:", err);
            }
        };

        const fetchCancerData = async () => {
            try {
                const res = await axios.get("http://localhost/cancer");
                setCancerList(res.data);
            } catch (err) {
                console.error("암 종류 데이터 실패:", err);
            }
        };

        const fetchStageData = async () => {
            try {
                const res = await axios.get("http://localhost/stage");
                setStageList(res.data);
            } catch (err) {
                console.error("암 병기 데이터 실패:", err);
            }
        };

        fetchUserInfo();
        fetchCancerData();
        fetchStageData();
    }, []);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if ((name === 'cancer' || name === 'stage') && value === "") {
            value = null;
        }
        setInfo({ ...info, [name]: value });
    };

    const handleFileChange = (e) => {
        setProfileImage(e.target.files[0]);
    };

    const handleUpdate = async () => {
        const { name, year, gender, email } = info;
        if (!name || !year || !gender || !email) {
            alert("필수 항목을 모두 입력해주세요.");
            return;
        }

        const formData = new FormData();
        Object.entries(info).forEach(([key, val]) => {
            if (val !== null && val !== "") formData.append(key, val);
        });

        if (profileImage) {
            formData.append("profile_image", profileImage);
        }

        try {
            const token = localStorage.getItem("token");

            const res = await axios.put("http://localhost/profile/update", formData, {
                headers: {
                    Authorization: token,
                    "Content-Type": "multipart/form-data"
                }
            });

            if (res.data.status === "success") {
                alert("프로필이 성공적으로 수정되었습니다.");
                window.location.href = "/profile";
            } else {
                alert("수정 실패. 다시 시도해주세요.");
            }
        } catch (err) {
            console.error("수정 요청 실패:", err);
            alert("서버 오류. 다시 시도해주세요.");
        }
    };

    return (
        <div className="login">
            <h2>프로필 수정</h2>
            <br />
            <h3>기본 정보</h3>
            <hr />
            <p style={{ textAlign: "right" }}>
                <span style={{ color: "red" }}> *</span> 필수 입력 사항
            </p>
            <br />
            <table>
                <tbody>
                <tr>
                    <th>NAME<span style={{ color: "red" }}> *</span></th>
                    <td>
                        <input type="text" name="name" value={info.name} onChange={handleChange} />
                    </td>
                </tr>
                <tr>
                    <th>YEAR<span style={{ color: "red" }}> *</span></th>
                    <td>
                        <input type="text" name="year" value={info.year} onChange={handleChange} />
                    </td>
                </tr>
                <tr>
                    <th>GENDER<span style={{ color: "red" }}> *</span></th>
                    <td>
                        <input type="radio" name="gender" value="남" checked={info.gender === "남"} onChange={handleChange} /> 남
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <input type="radio" name="gender" value="여" checked={info.gender === "여"} onChange={handleChange} /> 여
                    </td>
                </tr>
                <tr>
                    <th>EMAIL<span style={{ color: "red" }}> *</span></th>
                    <td>
                        <input type="text" name="email" value={info.email} onChange={handleChange} />
                    </td>
                </tr>
                <tr>
                    <th>암 종류</th>
                    <td>
                        <select name="cancer" value={info.cancer ?? ""} onChange={handleChange}>
                            <option value="">선택하세요</option>
                            {cancerList.map(c => (
                                <option key={c.cancer_idx} value={c.cancer_idx}>{c.cancer_name}</option>
                            ))}
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>암 병기</th>
                    <td>
                        <select name="stage" value={info.stage ?? ""} onChange={handleChange}>
                            <option value="">선택하세요</option>
                            {stageList.map(s => (
                                <option key={s.stage_idx} value={s.stage_idx}>{s.stage_name}</option>
                            ))}
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>프로필 공개여부</th>
                    <td>
                        <input type="radio" name="profile_yn" value="Y" checked={info.profile_yn === "Y"} onChange={handleChange} /> 공개
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <input type="radio" name="profile_yn" value="N" checked={info.profile_yn === "N"} onChange={handleChange} /> 비공개
                    </td>
                </tr>
                <tr>
                    <th>프로필 사진</th>
                    <td>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                    </td>
                </tr>
                <tr>
                    <th>인삿말</th>
                    <td>
                        <textarea name="intro" value={info.intro} onChange={handleChange} rows="4" cols="50" placeholder="간단한 자기소개를 적어주세요." />
                    </td>
                </tr>
                <tr>
                    <th colSpan="2">
                        <input type="button" value="수정하기" onClick={handleUpdate} />
                    </th>
                </tr>
                </tbody>
            </table>
        </div>
    );
}
