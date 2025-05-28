"use client";

import "../../login/login.css";
import { useEffect, useState } from "react";
import axios from "axios";

export default function UpdatePage() {
    const [info, setInfo] = useState({
        id: '',
        name: '',
        year: '',
        gender: '',
        email: '',
        cancer: null,
        stage: null,
        profile_yn: 'Y',
        intro: '',
        profile_photo: ''
    });

    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [cancerList, setCancerList] = useState([]);
    const [stageList, setStageList] = useState([]);

    const token = sessionStorage.getItem("token");
    const id = sessionStorage.getItem("id");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, cancerRes, stageRes] = await Promise.all([
                    axios.get(`http://localhost:80/profile/${id}`),
                    axios.get("http://localhost/cancer"),
                    axios.get("http://localhost/stage"),
                ]);

                const userData = userRes.data;
                setInfo({
                    id: userData.id,
                    name: userData.name || '',
                    year: userData.year || '',
                    gender: userData.gender || '',
                    email: userData.email || '',
                    cancer: userData.cancer ?? null,
                    stage: userData.stage ?? null,
                    profile_yn: userData.profile_yn || 'Y',
                    intro: userData.intro || '',
                    profile_photo: userData.profile_photo || ''
                });

                setCancerList(cancerRes.data);
                setStageList(stageRes.data);
            } catch (err) {
                console.error("데이터 로딩 실패:", err);
                alert("서버 연결에 문제가 발생했습니다.");
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if ((name === 'cancer' || name === 'stage') && value === "") {
            value = null;
        }
        setInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setProfileImage(file);
        if (previewImage) {
            URL.revokeObjectURL(previewImage); // 이전 미리보기 해제
        }
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async () => {
        if (!id) {
            alert("로그인 정보가 없습니다.");
            return;
        }

        const required = ['name', 'year', 'gender', 'email'];
        const missing = required.filter(field => !info[field]);
        if (missing.length > 0) {
            alert("필수 항목을 모두 입력해주세요.");
            return;
        }

        const formData = new FormData();
        const profileData = { ...info, profile_yn: info.profile_yn === "Y" };
        formData.append("info", new Blob([JSON.stringify(profileData)], { type: "application/json" }));

        if (profileImage) {
            formData.append("profile_image", profileImage);
        }

        try {
            const res = await axios.put(`http://localhost:80/profile/update/`, formData, {
                headers: {
                    Authorization: token
                },
                withCredentials: true
            });

            if (res.data.status === "success") {
                alert("프로필이 성공적으로 수정되었습니다.");
                window.location.href = "/profile";
            } else {
                alert("수정 실패: 다시 시도해주세요.");
            }
        } catch (err) {
            console.error("수정 오류:", err);
            if (err.response) {
                alert(`오류: ${err.response.status} - ${err.response.data.message || "서버 오류"}`);
            } else {
                alert("네트워크 오류 또는 서버 응답 없음");
            }
        }
    };

    return (
        <div className="login">
            <h2>프로필 수정</h2>
            <table>
                <tbody>
                <InputRow label="NAME" required name="name" value={info.name} onChange={handleChange} />
                <InputRow label="YEAR" required name="year" value={info.year} onChange={handleChange} />
                <GenderRow value={info.gender} onChange={handleChange} />
                <InputRow label="EMAIL" required name="email" value={info.email} onChange={handleChange} />
                <SelectRow label="암 종류" name="cancer" list={cancerList} value={info.cancer} onChange={handleChange} />
                <SelectRow label="암 병기" name="stage" list={stageList} value={info.stage} onChange={handleChange} />
                <RadioRow label="프로필 공개여부" name="profile_yn" value={info.profile_yn} onChange={handleChange} options={[{ label: "공개", value: "Y" }, { label: "비공개", value: "N" }]} />
                <tr>
                    <th>프로필 사진</th>
                    <td>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        {previewImage && <img src={previewImage} alt="미리보기" style={{ width: "100px", marginTop: "10px" }} />}
                    </td>
                </tr>
                <tr>
                    <th>인삿말</th>
                    <td>
                        <textarea name="intro" value={info.intro} onChange={handleChange} rows="4" cols="50" placeholder="간단한 자기소개를 적어주세요." />
                    </td>
                </tr>
                <tr>
                    <td colSpan="2" style={{ textAlign: "center" }}>
                        <input type="button" value="수정하기" onClick={handleUpdate} />
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );
}

// 🧱 서브 컴포넌트 (재사용 가능)
function InputRow({ label, required, name, value, onChange }) {
    return (
        <tr>
            <th>{label}{required && <span style={{ color: "red" }}> *</span>}</th>
            <td><input type="text" name={name} value={value} onChange={onChange} /></td>
        </tr>
    );
}

function SelectRow({ label, name, list, value, onChange }) {
    return (
        <tr>
            <th>{label}</th>
            <td>
                <select name={name} value={value ?? ""} onChange={onChange}>
                    <option value="">선택하세요</option>
                    {list.map(item => (
                        <option key={item[`${name}_idx`]} value={item[`${name}_idx`]}>
                            {item[`${name}_name`]}
                        </option>
                    ))}
                </select>
            </td>
        </tr>
    );
}

function RadioRow({ label, name, value, onChange, options }) {
    return (
        <tr>
            <th>{label}</th>
            <td>
                {options.map(opt => (
                    <label key={opt.value} style={{ marginRight: "1rem" }}>
                        <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={onChange} />
                        {opt.label}
                    </label>
                ))}
            </td>
        </tr>
    );
}

function GenderRow({ value, onChange }) {
    return (
        <tr>
            <th>GENDER<span style={{ color: "red" }}> *</span></th>
            <td>
                <label><input type="radio" name="gender" value="남" checked={value === "남"} onChange={onChange} /> 남</label>
                &nbsp;&nbsp;
                <label><input type="radio" name="gender" value="여" checked={value === "여"} onChange={onChange} /> 여</label>
            </td>
        </tr>
    );
}
