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
    const updatedOpenedCells = [...openedCells];
    if (updatedOpenedCells[row][col]) return; // 이미 열린 셀은 처리하지 않음

    updatedOpenedCells[row][col] = true;
    setOpenedCells(updatedOpenedCells);

    if (board[row][col] === 0) {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (let [dx, dy] of directions) {
        const newRow = row + dx, newCol = col + dy;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && !updatedOpenedCells[newRow][newCol]) {
          openCell(newRow, newCol);
        }
      }
    }
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
                {/* Show blank image for unopened cells, and the cell content for opened cells */}
                {openedCells[rowIndex][cellIndex]
                  ? (cell === 'mine'
                    ? <img src={mineImage} alt="Mine" />
                    : cell > 0
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
