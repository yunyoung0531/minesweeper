import React, { useEffect, useState } from 'react';
import './App.css';

// 셀의 상태를 나타내는 타입
type Cell = 'empty' | 'mine' | number;
type Board = Cell[][];
type OpenedCells = boolean[][];
type ZeroCells = Array<[number, number]>;

function App() {
  const boardSize = 8;
  const mineCount = 10;
  const mineImage = 'https://freeminesweeper.org/images/bombrevealed.gif';
  const blankCellImage = 'https://freeminesweeper.org/images/blank.gif';

  const [board, setBoard] = useState<Board>(initializeBoard());
  const [openedCells, setOpenedCells] = useState<OpenedCells>(initializeOpenedCells());
  // 0 값을 갖는 셀의 위치를 저장하는 상태를 추가합니다.
  const [zeroCells, setZeroCells] = useState<ZeroCells>([]);

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

        // 셀의 값이 0이면 해당 위치를 tempZeroCells에 추가합니다.
        if (board[row][col] === 0) {
          tempZeroCells.push([row, col]);
        }
      }
    }
    setZeroCells(tempZeroCells); // 상태 업데이트
    return board;
  }

  function openCell(row: number, col: number) {
    if (openedCells[row][col] || board[row][col] === 'mine') return;
  
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
              !newOpenedCells[newRow][newCol] && 
              board[newRow][newCol] === 0
            ) {
              queue.push([newRow, newCol]);
            }
          });
        }
      }
    }
  
    setOpenedCells(newOpenedCells);
  }
  
  
  useEffect(() => {
    const newBoard = placeMines(initializeBoard());
    setBoard(calculateMines(newBoard));
  }, []);

  return (
    <div className="app-container">
      <div className="game-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className={`cell ${openedCells[rowIndex][cellIndex] ? 'opened' : ''}`}
                onClick={() => openCell(rowIndex, cellIndex)}
                style={{ cursor: 'pointer' }} // Optional: Adds a pointer cursor on hover
              >
                {openedCells[rowIndex][cellIndex]
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