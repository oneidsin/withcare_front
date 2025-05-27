import axios from "axios";

export async function fetchVisibleBoards() {
    try {
        const res = await axios.get("http://localhost/board/list");
        const visible = res.data.filter(b => !b.blind_yn);
        return visible;
    } catch (err) {
        console.error("게시판 목록 로딩 실패", err);
        return [];
    }
}