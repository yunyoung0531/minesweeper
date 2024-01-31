// features/game/gameSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

// 여기에 적절한 타입을 정의합니다.
type Cell = 'empty' | 'mine' | number;
type Board = Cell[][];
type OpenedCells = boolean[][];

// 게임의 초기 상태를 정의합니다.
interface GameState {
    board: Board;
    openedCells: OpenedCells;
}

const boardSize = 8; // 이 값을 기반으로 보드 크기를 설정합니다.

// board 초기화
const initializeBoard = (): Board => {
  // 2차원 배열을 생성하고 모든 값을 'empty'로 초기화합니다.
    return Array.from({ length: boardSize }, () =>
        Array.from({ length: boardSize }, () => 'empty' as Cell)
    );
};

// openedCells 초기화
const initializeOpenedCells = (): OpenedCells => {
  // 2차원 배열을 생성하고 모든 값을 false로 초기화합니다.
    return Array.from({ length: boardSize }, () =>
        Array.from({ length: boardSize }, () => false)
    );
};


const initialState: GameState = {
    board: initializeBoard(),
    openedCells: initializeOpenedCells(),
};

export const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        resetGame: (state) => {
            state.board = initializeBoard();
            state.openedCells = initializeOpenedCells();
        },
        openCell: (state, action: PayloadAction<{ row: number; col: number }>) => {
            const { row, col } = action.payload;
            // 만약 셀이 이미 열려있거나 지뢰가 있다면 더 이상 진행하지 않습니다.
            if (state.openedCells[row][col] || state.board[row][col] === 'mine') {
            return;
            }
            // 선택된 셀을 연다.
            state.openedCells[row][col] = true;
    
            // 만약 선택된 셀 주변에 지뢰가 없다면 (즉, 셀의 값이 0이라면) 주변 셀도 연다.
            if (state.board[row][col] === 0) {
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
    
            directions.forEach(([dx, dy]) => {
                const newRow = row + dx;
                const newCol = col + dy;
                if (newRow >= 0 && newRow < state.board.length && newCol >= 0 && newCol < state.board[0].length) {
                // 재귀적으로 주변 셀을 연다.
                if (!state.openedCells[newRow][newCol] && state.board[newRow][newCol] === 0) {
                    state.openedCells[newRow][newCol] = true;
                }
                }
            });
            }
        },
        // 추가 액션들을 정의할 수 있습니다.
    },
});

export const { resetGame, openCell } = gameSlice.actions;


// 게임 상태의 선택자를 정의합니다.
export const selectBoard = (state: RootState) => state.game.board;
export const selectOpenedCells = (state: RootState) => state.game.openedCells;

export default gameSlice.reducer;
