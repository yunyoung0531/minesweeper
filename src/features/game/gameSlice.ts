// features/game/gameSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

type Level = 'beginner' | 'intermediate' | 'expert';
type Cell = 'empty' | 'mine' | number;

interface GameState {
    gameStarted: boolean;
    gameOver: boolean;
    gameWon: boolean;
    timer: number;
    level: 'beginner' | 'intermediate' | 'expert';
    width: number;
    height: number;
    mineCount: number;
    remainingMines: number;
    board: Cell[][];
    openedCells: boolean[][];
    flaggedCells: boolean[][];
    zeroCells: Array<[number, number]>;
}

// 초기 상태에 레벨과 보드 설정의 초기값을 추가
const initialState: GameState = {
    gameStarted: false,
    gameOver: false,
    gameWon: false,
    timer: 0,
    level: 'beginner', // 기본 레벨
    width: 8, // 기본 너비
    height: 8, // 기본 높이
    mineCount: 10, // 기본 지뢰 수
    remainingMines: 10,
    board: [],
    openedCells: [],
    flaggedCells: [],
    zeroCells: [],
};

interface LevelSettings {
    width: number;
    height: number;
    mines: number;
}
const levelConfigs: Record<Level, LevelSettings> = {
    beginner: { width: 8, height: 8, mines: 10 },
    intermediate: { width: 16, height: 16, mines: 40 },
    expert: { width: 30, height: 16, mines: 99 }, // 가정: 'expert' 설정을 예로 듭니다
};

function getLevelSettings(level: Level): LevelSettings {
    // 주어진 레벨에 해당하는 설정 반환
    // 레벨이 유효하지 않은 경우 기본값으로 'beginner' 설정을 반환
    return levelConfigs[level] || levelConfigs.beginner;
}

export const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        // 게임 시작 액션
        startGame: (state) => {
            state.gameStarted = true;
            state.gameOver = false; // 게임 시작 시 gameOver와 gameWon을 초기화
            state.gameWon = false;
        },
        // 게임 오버 액션
        endGame: (state) => {
            state.gameOver = true;
        },
        // 게임 승리 액션
        winGame: (state) => {
            state.gameWon = true;
            state.gameOver = true; // 게임을 이겼으므로 gameOver도 true로 설정
        },
        resetGameStarted: (state) => {
            state.gameStarted = false;
        },
    
          // 게임 오버 상태를 false로 설정
        resetGameOver: (state) => {
            state.gameOver = false;
        },

          // 게임 승리 상태를 false로 설정
        resetGameWon: (state) => {
            state.gameWon = false;
        },
        startTimer: (state) => {
            state.timer = 0; // 타이머 초기화
        },
        // 타이머 업데이트 (1초마다 호출)
        updateTimer: (state) => {
            state.timer += 1; // 타이머를 1초 증가
        },
        // 타이머 리셋 (게임 리셋 시 호출)
        resetTimer: (state) => {
            state.timer = 0; // 타이머 초기화
        },
        
        // 레벨 변경 액션
        changeLevel: (state, action: PayloadAction<GameState['level']>) => {
            // state.level = action.payload;
            // 여기서 level에 따라 width, height, mineCount 업데이트 로직 구현
            const { width, height, mines } = getLevelSettings(action.payload);
            state.width = width;
            state.height = height;
            state.mineCount = mines;
        },
        
        updateRemainingMines: (state, action: PayloadAction<number>) => {
            state.remainingMines = action.payload;
        },

        updateCustomGameSettings: (
            state,
            action: PayloadAction<{ width: number; height: number; mineCount: number }>
        ) => {
            const { width, height, mineCount } = action.payload;
            state.width = width;
            state.height = height;
            state.mineCount = mineCount;

            // 나머지 게임 상태를 초기화 또는 업데이트할 수 있습니다.
            state.gameStarted = false;
            state.gameOver = false;
            state.gameWon = false;
            state.remainingMines = mineCount;
            // 필요에 따라 board, openedCells, flaggedCells 등을 재설정할 수 있습니다.
        },
    },
});

export const {
    startGame, endGame, winGame, resetGameStarted, resetGameOver, resetGameWon,
    startTimer, updateTimer, resetTimer,
    changeLevel, updateRemainingMines
} = gameSlice.actions;

export const selectGameStarted = (state: RootState) => state.game.gameStarted;
export const selectGameOver = (state: RootState) => state.game.gameOver;
export const selectGameWon = (state: RootState) => state.game.gameWon;

export const selectLevel = (state: RootState) => state.game.level;
export const selectWidth = (state: RootState) => state.game.width;
export const selectHeight = (state: RootState) => state.game.height;
export const selectMineCount = (state: RootState) => state.game.mineCount;

export const selectRemainingMines = (state: RootState) => state.game.remainingMines;

export const { updateCustomGameSettings } = gameSlice.actions;

export default gameSlice.reducer;
