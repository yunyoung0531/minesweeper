import React, { useEffect, useState } from 'react';
import './App.css';

// 셀의 상태를 나타내는 타입
type Cell = 'empty' | 'mine' | number;
type Board = Cell[][];

function App() {
  const boardSize = 8;
  const mineCount = 10;
  const mineImage = 'https://freeminesweeper.org/images/bombrevealed.gif';

  const [board, setBoard] = useState<Board>(initializeBoard());

  function initializeBoard(): Board {
    return Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => 'empty' as Cell)
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
              <div key={cellIndex} className="cell">
              {typeof cell === 'number' && cell > 0 ? cell :
                cell === 'mine' ? <img src={mineImage} alt="Mine" /> : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
