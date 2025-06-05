'use client';

import { useState, useEffect } from "react";
import axios from "axios";
import './board.css';

export default function BoardWrite() {
    const [form, setForm] = useState({
        board_name: '',
        lv_idx: '',
        anony_yn: false,
        blind_yn: false,
        view_level: '',
        parent_board_idx: '',
        com_yn: true  // 기본값은 댓글 허용
    });

    const [boardList, setBoardList] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [newBoardName, setNewBoardName] = useState('');

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const res = await axios.get("http://localhost/board/list");
            setBoardList(res.data);
        } catch (err) {
            alert("게시판 목록을 불러오는 데 실패했습니다.");
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRadioChange = (name, value) => {
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBoardClick = async (idx) => {
        try {
            const res = await axios.get(`http://localhost/board/${idx}`);
            setSelectedIdx(idx);

            const normalizedData = {
                ...res.data,
                parent_board_idx: res.data.parent_board_idx ?? '',
                lv_idx: res.data.lv_idx ?? '',
            };

            setForm(normalizedData);
        } catch (err) {
            alert("게시판 정보를 불러오는 데 실패했습니다.");
        }
    };


    const handleSubmit = async () => {
        const token = sessionStorage.getItem("token");
        if (!form.board_name.trim()) {
            alert("게시판 이름은 필수입니다.");
            return;
        }

        try {
            const url = selectedIdx
                ? `http://localhost/board/update`
                : "http://localhost/board/write";

            const method = selectedIdx ? 'put' : 'post';

            const res = await axios({
                method,
                url,
                data: form,
                headers: { Authorization: token }
            });

            if (res.data.success) {
                alert(selectedIdx ? "게시판이 수정되었습니다." : "게시판이 등록되었습니다.");
                location.reload();
                fetchBoards();
                setForm({
                    board_name: '',
                    lv_idx: '',
                    anony_yn: false,
                    blind_yn: false,
                    com_yn: true
                });
                setSelectedIdx(null);
                setNewBoardName('');
            } else {
                alert("실패: " + res.data.msg);
            }
        } catch (err) {
            alert("서버 오류 발생");
        }
    };

    const handleNewBoardCreate = () => {
        if (!newBoardName.trim()) return;

        setForm(prev => ({
            ...prev,
            board_name: newBoardName,
            parent_board_idx: '',
            view_level: '',
            com_yn: true
        }));
        setSelectedIdx(0);
    };

    return (
        <div className="board-layout">
            <h2 className="board-title">게시판 관리</h2>
            <div className="board-inner">
                <section className="board-tree">
                    <h3 className="section-label">게시판 전체 보기</h3>
                    <ul className="tree-list">
                        {boardList.map(board => (
                            <li key={board.board_idx} onClick={() => handleBoardClick(board.board_idx)} style={{ cursor: 'pointer' }}>
                                {board.board_name}
                            </li>
                        ))}
                    </ul>
                    <input
                        type="text"
                        placeholder="새 게시판"
                        className="tree-input"
                        value={newBoardName}
                        onChange={e => setNewBoardName(e.target.value)}
                    />
                    <button className="tree-add" onClick={handleNewBoardCreate}>입력 → 수정 영역</button>
                </section>

                <section className="board-form">
                    <div className="form-group">
                        <label>게시판 명</label>
                        <input
                            className="board-name"
                            type="text"
                            name="board_name"
                            value={form.board_name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>부모 게시판 선택</label>
                        <select
                            name="parent_board_idx"
                            value={form.parent_board_idx}
                            onChange={handleChange}
                        >
                            <option value="">없음 (최상위 게시판)</option>
                            {boardList
                                .filter(board => board.board_idx !== selectedIdx) // 자기 자신은 제외
                                .map(board => (
                                    <option key={board.board_idx} value={board.board_idx}>
                                        {board.board_name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>열람 제한 레벨</label>
                        <select
                            name="lv_idx"
                            value={form.lv_idx}
                            onChange={handleChange}
                        >
                            <option value="">선택</option>
                            <option value="1">레벨 1 이상</option>
                            <option value="2">레벨 2 이상</option>
                            <option value="3">레벨 3 이상</option>
                            <option value="4">레벨 4 이상</option>
                            <option value="5">레벨 5 이상</option>
                            <option value="6">레벨 6 이상</option>
                            <option value="7">관리자만</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>익명 설정</label>
                        <div className="form-radio">
                            <label><input type="radio" name="anony_yn" checked={form.anony_yn === true} onChange={() => handleRadioChange("anony_yn", true)} /> 익명 활성화</label>
                            <label><input type="radio" name="anony_yn" checked={form.anony_yn === false} onChange={() => handleRadioChange("anony_yn", false)} /> 익명 비활성화</label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>블라인드</label>
                        <div className="form-radio">
                            <label><input type="radio" name="blind_yn" checked={form.blind_yn === true} onChange={() => handleRadioChange("blind_yn", true)} /> 활성화</label>
                            <label><input type="radio" name="blind_yn" checked={form.blind_yn === false} onChange={() => handleRadioChange("blind_yn", false)} /> 비활성화</label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>댓글 허용</label>
                        <div className="form-radio">
                            <label><input type="radio" name="com_yn" checked={form.com_yn === true} onChange={() => handleRadioChange("com_yn", true)} /> 허용</label>
                            <label><input type="radio" name="com_yn" checked={form.com_yn === false} onChange={() => handleRadioChange("com_yn", false)} /> 비허용</label>
                        </div>
                    </div>

                    <div className="form-submit">
                        <button onClick={handleSubmit}>저장</button>
                    </div>
                </section>
            </div>
        </div>
    );
}
