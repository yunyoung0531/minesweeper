import React, { useEffect, useState } from 'react';
import './App.css';

// 셀의 상태를 나타내는 타입
type Cell = 'empty' | 'mine' | number;
type Board = Cell[][];
type OpenedCells = boolean[][];

function App() {
  const boardSize = 8;
  const mineCount = 10;
  const mineImage = 'https://freeminesweeper.org/images/bombrevealed.gif';
  const blankCellImage = 'https://freeminesweeper.org/images/blank.gif';

  const [board, setBoard] = useState<Board>(initializeBoard());
  const [openedCells, setOpenedCells] = useState<OpenedCells>(initializeOpenedCells());

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
      }
    }
    return board;
  }

  function openCell(row: number, col: number) {
    // 클릭한 셀이 이미 열려있거나 지뢰가 있는 셀이라면 아무 동작도 수행하지 않는다.
    if (openedCells[row][col] || board[row][col] === 'mine') return;
  
    // 새로운 상태를 만들기 위해 상태의 불변성을 유지하면서 복사본을 생성한다.
    const newOpenedCells = openedCells.map(row => [...row]);
    newOpenedCells[row][col] = true;
  
    // 만약 클릭한 셀의 값이 0이면 주변 셀도 연다.
    if (board[row][col] === 0) {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
  
      directions.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
          // 주변 셀이 닫혀있고, 지뢰가 아니며, 값이 0인 경우에만 열기
          if (!newOpenedCells[newRow][newCol] && board[newRow][newCol] === 0) {
            openCell(newRow, newCol);
          }
        }
      });
    }
  
    // 상태 업데이트
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
