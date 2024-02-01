import React, { useEffect, useState } from 'react';
import './App.css';

// 셀의 상태를 나타내는 타입
type Cell = 'empty' | 'mine' | number;
type Board = Cell[][];
type OpenedCells = boolean[][];
type ZeroCells = Array<[number, number]>;
// 깃발 상태를 나타내는 타입 추가
type FlaggedCells = boolean[][];
function App() {
  const boardSize = 8;
  const mineCount = 10;
  const mineImage = 'https://freeminesweeper.org/images/bombrevealed.gif';
  const blankCellImage = 'https://freeminesweeper.org/images/blank.gif';
  const flagImage = 'https://freeminesweeper.org/images/bombflagged.gif';
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [openedCells, setOpenedCells] = useState<OpenedCells>(initializeOpenedCells());
  // 0 값을 갖는 셀의 위치를 저장하는 상태를 추가
  const [zeroCells, setZeroCells] = useState<ZeroCells>([]);
  // 깃발이 꽂힌 셀의 상태를 추가.
  const [flaggedCells, setFlaggedCells] = useState<FlaggedCells>(initializeFlaggedCells());
  // 현재 선택된 셀의 위치를 추적하는 상태를 추가.
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null); //스페이스바 위함
  // 지뢰의 갯수를 표시할 상태를 추가합니다.
  const [remainingMines, setRemainingMines] = useState(mineCount);
  const [timer, setTimer] = useState(0);
  // 게임 종료 상태를 추가합니다.
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false); // 게임 이겼는지

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

  function initializeBoard(): Board {
    return Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => 'empty' as Cell)
    );
  }
  function initializeOpenedCells(): OpenedCells {
    return Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => false)
    );
  }
  function placeMines(board: Board): Board {
    let placedMines = 0;
    while (placedMines < mineCount) {
      const row = Math.floor(Math.random() * boardSize);
      const col = Math.floor(Math.random() * boardSize);

      if (board[row][col] === 'empty') {
        board[row][col] = 'mine';
        placedMines++;
      }
    }
    return board;
  }

  function calculateMines(board: Board): Board {
    let tempZeroCells: ZeroCells = []; // 0 값을 갖는 셀의 위치를 임시 저장할 배열

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === 'mine') continue;

        let mineCount = 0;
        for (let [dx, dy] of directions) {
          const newRow = row + dx, newCol = col + dy;
          if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && board[newRow][newCol] === 'mine') {
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
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
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
              newRow >= 0 && newRow < boardSize && 
              newCol >= 0 && newCol < boardSize &&
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

    function initializeFlaggedCells(): FlaggedCells {
    return Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => false)
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
    // 새 게임을 위한 보드 초기화
    const newBoard = initializeBoard();
    const newMinesPlacedBoard = placeMines(newBoard);
    const newCalculatedBoard = calculateMines(newMinesPlacedBoard);

    // 지뢰판을 새로 계산한 보드로 설정
    setBoard(newCalculatedBoard);

    // 나머지 상태들을 초기화
    setOpenedCells(initializeOpenedCells());
    setFlaggedCells(initializeFlaggedCells());
    setZeroCells([]);
    setGameOver(false);
    setRemainingMines(mineCount);
    setGameStarted(false);
    setTimer(0);
    setGameWon(false);
  }

  useEffect(() => {
    const newBoard = placeMines(initializeBoard());
    setBoard(calculateMines(newBoard));
  }, []);

  return (
    <div 
      className="app-container" 
      onKeyDown={handleKeyDown} 
      tabIndex={0} // 여기에 tabIndex를 추가하여 키보드 이벤트를 받을 수 있도록
    >
      {/* <div className="mine-count">
        Remaining Mines: {remainingMines}
      </div> */}
      <header className="game-header">
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
  );
}

export default App;