import React, { useEffect, useState } from 'react';
import './App.css';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './app/store'; 
import { startGame, endGame, winGame, selectGameStarted, selectGameOver, selectGameWon, resetGameStarted, resetGameOver, resetGameWon,
  startTimer, updateTimer, resetTimer,
  changeLevel as changeLevelAction, selectLevel, selectWidth, selectHeight, selectMineCount,
  selectRemainingMines, updateRemainingMines
  } from './features/game/gameSlice';


// 셀의 상태를 나타내는 타입
type Cell = 'empty' | 'mine' | number;
type Board = Cell[][];
type OpenedCells = boolean[][];
type ZeroCells = Array<[number, number]>;
// 깃발 상태를 나타내는 타입 추가
type FlaggedCells = boolean[][];
type Level = 'beginner' | 'intermediate' | 'expert';
type LevelConfig = {
  width: number;
  height: number;
  mines: number;
};

// 각 레벨에 따른 게임 보드 크기와 지뢰 수 설정
const levels: Record<Level, LevelConfig> = {
  beginner: { width: 8, height: 8, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 32, height: 16, mines: 100 }, // 예를 들어 expert는 직사각형 게임 보드
};

function App() {
  const dispatch = useDispatch();

  const gameStarted = useSelector(selectGameStarted);
  const gameOver = useSelector(selectGameOver);
  const gameWon = useSelector(selectGameWon);

  const defaultMineCount = 10;
  const mineImage = 'https://freeminesweeper.org/images/bombrevealed.gif';
  const blankCellImage = 'https://freeminesweeper.org/images/blank.gif';
  const flagImage = 'https://freeminesweeper.org/images/bombflagged.gif';
  // const [board, setBoard] = useState<Board>(initializeBoard());
  const [openedCells, setOpenedCells] = useState<OpenedCells>([]); // 초기 상태를 빈 배열로 설정
  // 0 값을 갖는 셀의 위치를 저장하는 상태를 추가
  const [zeroCells, setZeroCells] = useState<ZeroCells>([]);
  // 깃발이 꽂힌 셀의 상태를 추가.
  const [flaggedCells, setFlaggedCells] = useState<FlaggedCells>([]); // 빈 배열로 초기화
  // 현재 선택된 셀의 위치를 추적하는 상태를 추가.
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null); //스페이스바 위함
  // 지뢰의 갯수를 표시할 상태를 추가합니다. 

  const timer = useSelector((state: RootState) => state.game.timer);

  const level = useSelector(selectLevel);
  const width = useSelector(selectWidth);
  const height = useSelector(selectHeight);
  const mineCount = useSelector(selectMineCount);
  const remainingMines = useSelector(selectRemainingMines);


  const [showMenu, setShowMenu] = useState(false);//네비게이션바- 모달
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  useEffect(() => {
    resetGame();
  }, [level, dispatch]);

  const [board, setBoard] = useState<Board>([]);

  useEffect(() => {
    resetGame();
  }, [width, height, mineCount]);

  useEffect(() => {
    initializeBoard();
  }, [width, height, mineCount]);

  const changeLevel = (newLevel: Level) => {
    dispatch(changeLevelAction(newLevel));
  };

  useEffect(() => {
    setFlaggedCells(initializeFlaggedCells(width, height));
  }, [width, height]);
  
  const resetButtonImage = gameWon
  ? 'https://freeminesweeper.org/images/facewin.gif'
  : gameOver
  ? 'https://freeminesweeper.org/images/facedead.gif'
  : 'https://freeminesweeper.org/images/facesmile.gif';

  useEffect(() => {
    let intervalId: number | undefined; // 타입을 number | undefined로 지정
    if (gameStarted && !gameOver && !gameWon) {
        intervalId = window.setInterval(() => { // window.setInterval을 사용하여 브라우저의 타이머 ID를 명시적으로 지정
        dispatch(updateTimer());
        }, 1000);
    }
    return () => {
        if (intervalId) clearInterval(intervalId);
    };
}, [gameStarted, gameOver, gameWon, dispatch]);


  //게임 이기는 조건 체크
  useEffect(() => {
    if (gameStarted && !gameOver && checkWin()) {
      dispatch(winGame());
      dispatch(endGame());
      }
  }, [openedCells, gameStarted, gameOver])

  
  function initializeOpenedCells(width: number, height: number): OpenedCells {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false)
    );
  }
  function placeMines(board: Board, firstClickRow: number, firstClickCol: number, width: number, height: number): Board {
    let placedMines = 0;
    while (placedMines < mineCount) {
      const row = Math.floor(Math.random() * height);
      const col = Math.floor(Math.random() * width);

         // 첫 번째 클릭한 셀에만 지뢰를 배치 ㄴㄴ
      if (row === firstClickRow && col === firstClickCol) continue;

      if (board[row][col] === 'empty') {
        board[row][col] = 'mine';
        placedMines++;
      }
    }
    return board;
  }

  //첫번째 클릭한 셀 주변인지 확인
  function isFirstClickAdjacent(row: number, col: number, firstClickRow: number, firstClickCol: number): boolean {
    return Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1;
  }

  //문제가 있던 함수 !!
  function calculateMines(board: Board): Board {
    let tempZeroCells: ZeroCells = []; // 0 값을 갖는 셀의 위치를 임시 저장할 배열

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (board[row][col] === 'mine') continue;

        let mineCount = 0;
        for (let [dx, dy] of directions) {
          const newRow = row + dx, newCol = col + dy;
          if (newRow >= 0 && newRow < height && newCol >= 0 && newCol < width  && board[newRow][newCol] === 'mine') {
            mineCount++;
          }
        }
        board[row][col] = mineCount;

        // 셀의 값이 0이면 해당 위치를 tempZeroCells에 추가
        if (board[row][col] === 0) {
          tempZeroCells.push([row, col]);
        }
      }
    }
    setZeroCells(tempZeroCells); // 상태 업데이트
    return board;
  }

  function revealMines() {
    // 모든 지뢰의 위치를 보여주는 함수
    // 지뢰가 있는 모든 셀을 열린 상태로 설정
    const newOpenedCells = board.map((row, rowIndex) =>
      row.map((cell, cellIndex) => cell === 'mine' || openedCells[rowIndex][cellIndex])
    );
    setOpenedCells(newOpenedCells);
    dispatch(endGame());
  }

  function checkWin(): boolean {
    for (let row = 0; row < (height); row++) {
      for (let col = 0; col < width ; col++) {
        if (board[row][col] !== 'mine' && !openedCells[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  function openCell(row: number, col: number) {
    if (!gameStarted) {
      dispatch(startGame());
      // 여기서 첫 클릭된 셀을 기준으로 지뢰를 배치합니다.
      const newBoardWithMines = placeMines(board, row, col, width, height); // 첫 클릭 위치를 인자로 지뢰 배치
      const calculatedBoard = calculateMines(newBoardWithMines);
      setBoard(calculatedBoard);
      // 첫 번째 셀을 열기 전에 지뢰가 배치되도록 로직을 조정
    }
    if (checkWin()) {
      dispatch(endGame());
      dispatch(resetGameStarted()); // 게임 승리 시 게임 시작 상태를 false로 설정
    }

    if (openedCells[row][col] || flaggedCells[row][col] || gameOver) return;

        // 만약 지뢰를 클릭했다면, 모든 지뢰를 보여주고 게임을 종료합니다.
        if (board[row][col] === 'mine') {
          revealMines();
          return;
        }
  
    const newOpenedCells = openedCells.map(row => [...row]);
    const queue = [[row, col]];
  
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const [currentRow, currentCol] = current;
  
      if (!newOpenedCells[currentRow][currentCol]) {
        newOpenedCells[currentRow][currentCol] = true;
  
        if (board[currentRow][currentCol] === 0) {
          const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1], [1, 0], [1, 1]
          ];
  
          directions.forEach(([dx, dy]) => {
            const newRow = currentRow + dx;
            const newCol = currentCol + dy;
            if (
              newRow >= 0 && newRow < height && 
              newCol >= 0 && newCol < width &&
              !newOpenedCells[newRow][newCol] 
            ) {
              queue.push([newRow, newCol]);
            }
          });
        }
      }
    }
    // 깃발이 꽂힌 셀이면 아무 것도 하지 않음
    if (flaggedCells[row][col]) return;
  
    setOpenedCells(newOpenedCells);
  }

  function initializeFlaggedCells(width: number, height: number): FlaggedCells {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false)
    );
  }
  
  function handleCellMouseEnter(row: number, col: number) {
    setSelectedCell([row, col]); // 마우스가 셀 위에 있을 때 셀의 위치를 설정
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (selectedCell && (event.key === ' ' || event.key === 'Spacebar')) {
      event.preventDefault();
      const [row, col] = selectedCell;
      toggleFlag(row, col); // 선택된 셀에 깃발을 토글
    }
  }

  function toggleFlag(row: number, col: number) {
    const newFlaggedCells = flaggedCells.map((rowArray, rowIndex) => 
      rowArray.map((cell, colIndex) => 
        rowIndex === row && colIndex === col ? !cell : cell
      )
    );
    setFlaggedCells(newFlaggedCells);

    // 깃발이 추가되거나 제거될 때 남은 지뢰 수 업데이트
    const flagged = newFlaggedCells[row][col];
    const adjustment = flagged ? -1 : 1; // 깃발 추가 시 -1, 제거 시 +1
    dispatch(updateRemainingMines(remainingMines + adjustment));
}


  function handleContextMenu(event: React.MouseEvent, row: number, col: number) {
    event.preventDefault();
    toggleFlag(row, col);
  }

  const resetGame = () => {
    dispatch(resetGameStarted());
    dispatch(resetGameOver());
    dispatch(resetGameWon());
    dispatch(resetTimer());
    initializeBoard();
  };

  function initializeBoard() {
    const newBoard: Board = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 'empty')
    );
    setBoard(newBoard);
    setOpenedCells(Array.from({ length: height }, () => Array.from({ length: width }, () => false)));
    setFlaggedCells(Array.from({ length: height }, () => Array.from({ length: width }, () => false)));
    dispatch(updateRemainingMines(mineCount));
  }

  
  return (
    <div 
      className="app-container" 
      onKeyDown={handleKeyDown} 
      tabIndex={0} // 여기에 tabIndex를 추가하여 키보드 이벤트를 받을 수 있도록
    >
      <div className='mini-game'>
        <div className='mini-game-nav'>
          <a onClick={toggleMenu}>Gameㅤ</a>
          <a>Optionsㅤ</a>
          <a>Help</a>
        </div>
        
      <header className="game-header">
      {showMenu && (
            <div className="game-menu active">
            {/* // <div className={`game-menu ${showMenu ? 'active' : ''}`}> */}
              <ul>
                <li style={{borderBottom: '1px solid #ccc'}}>New</li>
                <li onClick={() => changeLevel('beginner')}>Beginner</li>
                <li onClick={() => changeLevel('intermediate')}>Intermediate</li>
                <li onClick={() => changeLevel('expert')}>Expert</li>
                <li style={{borderBottom: '1px solid #ccc'}}>Custom</li>
                <li style={{borderBottom: '1px solid #ccc'}}>Personal Best</li>
                <li>Exit</li>
              </ul>
            </div>
          )}
        <div className="mine-count">
          {String(remainingMines).padStart(3, '0')}
        </div>
        {/* <button className="reset-button"> */}
        <img 
          className="reset-button" 
          src={resetButtonImage} 
          alt="Reset Game"
          onClick={resetGame}
        />
        {/* </button> */}
        <div className="timer">
          {String(timer).padStart(3, '0')}
        </div>
      </header>
      <div className="game-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className={`cell ${openedCells[rowIndex][cellIndex] ? 'opened' : ''} ${flaggedCells[rowIndex][cellIndex] ? 'flagged' : ''}`}
                onClick={() => openCell(rowIndex, cellIndex)}
                onContextMenu={(event) => { event.preventDefault(); toggleFlag(rowIndex, cellIndex); }}
                onMouseEnter={() => handleCellMouseEnter(rowIndex, cellIndex)}
                tabIndex={0} // 키보드 포커스를 위해 tabIndex를 0으로 설정
                style={{ cursor: 'pointer' }}
              >
                {/* 깃발 표시 로직 */}
                {flaggedCells[rowIndex][cellIndex] && !openedCells[rowIndex][cellIndex]
                  ? <img src={flagImage} alt="Flag" style={{ width: '20px', height: '20px' }} />
                  : openedCells[rowIndex][cellIndex]
                    ? (cell === 'mine'
                      ? <img src={mineImage} alt="Mine" />
                      : typeof cell === 'number' && cell > 0
                        ? cell
                        : '')
                    : <img src={blankCellImage} alt="Blank" />}
              </div>
            ))}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

export default App;