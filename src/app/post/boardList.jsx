import axios from "axios";

export async function fetchVisibleBoards() {
    try {
        const res = await axios.get("http://localhost/board/list");
        const visible = res.data.filter(b => !b.blind_yn);
        
        // 자식 게시판이 있는 부모 게시판 찾기
        const parentIds = new Set(
            visible
                .filter(board => board.parent_board_idx !== null)
                .map(board => board.parent_board_idx)
        );
        
        // board_idx가 1, 5, 6인 게시판에 관리자 전용 표시 추가
        // 및 자식 게시판이 있는 부모 게시판 표시
        const boardsWithFlags = visible.map(board => {
            const isAdminOnly = [1, 5, 6].includes(board.board_idx);
            const hasChildren = parentIds.has(board.board_idx);
            
            return {
                ...board,
                isAdminOnly,
                hasChildren
            };
        });
        
        return boardsWithFlags;
    } catch (err) {
        console.error("게시판 목록 로딩 실패", err);
        return [];
    }
}