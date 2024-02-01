import React, { useEffect, useState } from 'react';
import './App.css';

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
  // const boardSize = 8;
  // const mineCount = 10;
  const defaultMineCount = 10;
  const initialLevel = 'beginner';
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
  // const [remainingMines, setRemainingMines] = useState(mineCount);
  const [remainingMines, setRemainingMines] = useState(defaultMineCount);
  const [timer, setTimer] = useState(0);
  // 게임 종료 상태를 추가합니다.
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false); // 게임 이겼는지

  const [showMenu, setShowMenu] = useState(false);//네비게이션바- 모달
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  
  const [level, setLevel] = useState<Level>(initialLevel);
  const [width, setWidth] = useState(levels[initialLevel].width);
  const [height, setHeight] = useState(levels[initialLevel].height);
  const [mineCount, setMineCount] = useState(levels[initialLevel].mines);
  useEffect(() => {
    // 난이도 변경 시 새로운 설정을 적용
    const config = levels[level];
    setWidth(config.width);
    setHeight(config.height);
    setMineCount(config.mines);
    resetGame(); // 보드 및 관련 상태 초기화
  }, [level]);

  const [board, setBoard] = useState<Board>([]); // 빈 배열로 초기화

  // const [level, setLevel] = useState<Level>(initialLevel);
  // const [boardSize, setBoardSize] = useState(levels[initialLevel].size);

  useEffect(() => {
    // boardSize와 mineCount가 정의된 후에 보드를 초기화합니다.
    const initialBoard = initializeBoard(width, height);
    setBoard(initialBoard);
  }, [width, height]);

    

  useEffect(() => {
    // 난이도 변경 시 보드 초기화
    resetGame();
  // }, [level]);
  }, [width, height, mineCount]); // 의존성 배열에 boardSize와 mineCount를 추가합니다.

  useEffect(() => {
    // boardSize가 설정된 후에 flaggedCells의 초기 상태를 설정
    setFlaggedCells(initializeFlaggedCells(width, height));
  }, [width, height]);
  
  const changeLevel = (newLevel: Level) => {
    const levelConfig = levels[newLevel];
    setWidth(levelConfig.width);
    setHeight(levelConfig.height);
    setMineCount(levelConfig.mines);
    resetGame();
  };

  const resetButtonImage = gameWon
  ? 'https://freeminesweeper.org/images/facewin.gif'
  : gameOver
  ? 'https://freeminesweeper.org/images/facedead.gif'
  : 'https://freeminesweeper.org/images/facesmile.gif';
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
  
    if (gameStarted && !gameOver && !gameWon) {
      intervalId = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } 
    // else {
    //   clearInterval(intervalId); // 게임이 끝나거나 승리하면 타이머 멈춤
    // }
  
    // return () => clearInterval(intervalId);
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [gameStarted, gameOver, gameWon])

  //게임 이기는 조건 체크
  useEffect(() => {
    if (gameStarted && !gameOver && checkWin()) {
      setGameWon(true);
      setGameOver(true);
    }
  }, [openedCells, gameStarted, gameOver])

  function initializeBoard(width: number, height: number): Board {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 'empty')
    );
  }
  
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
    setGameOver(true); // 게임 종료 상태를 true로 설정
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
      setGameStarted(true);
      // 여기서 첫 클릭된 셀을 기준으로 지뢰를 배치합니다.
      const newBoardWithMines = placeMines(board, row, col, width, height); // 첫 클릭 위치를 인자로 지뢰 배치
      const calculatedBoard = calculateMines(newBoardWithMines);
      setBoard(calculatedBoard);
      // 첫 번째 셀을 열기 전에 지뢰가 배치되도록 로직을 조정
    }
    if (checkWin()) {
      setGameOver(true);
      setGameStarted(false); // 게임 승리 시 게임 시작 상태를 false로 설정
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
    const newFlaggedCells = flaggedCells.map(row => [...row]);
    newFlaggedCells[row][col] = !newFlaggedCells[row][col];
    setFlaggedCells(newFlaggedCells);

    // 깃발이 추가되거나 제거될 때 지뢰의 갯수를 업데이트
    setRemainingMines(prev => newFlaggedCells[row][col] ? prev - 1 : prev + 1);
  }


  function handleContextMenu(event: React.MouseEvent, row: number, col: number) {
    event.preventDefault();
    toggleFlag(row, col);
  }

  function resetGame() {
    const newBoard = initializeBoard(width, height);
    const newOpenedCells = initializeOpenedCells(width, height);
    const newFlaggedCells = initializeFlaggedCells(width, height);
  // 보드 상태를 초기화
  setBoard(newBoard);
  // 나머지 상태들을 초기화
  setOpenedCells(initializeOpenedCells(width, height)); 
  setFlaggedCells(initializeFlaggedCells(width, height));
  setZeroCells([]);
  setGameOver(false);
  setRemainingMines(mineCount);
  setGameStarted(false);
  setTimer(0);
  setGameWon(false);
  }

  useEffect(() => {
    const initialBoard = initializeBoard(width, height);
    setBoard(initialBoard); 
    setOpenedCells(initializeOpenedCells(width, height));
    setFlaggedCells(initializeFlaggedCells(width, height));
  }, [width, height, mineCount]);


  
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
          /* 여기에 게임을 리셋하는 함수를 연결 하기*/
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