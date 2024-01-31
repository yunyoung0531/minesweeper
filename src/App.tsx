import React, { useEffect, useState } from 'react';
import './App.css';

type Cell = 'empty' | 'mine';
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

  useEffect(() => {
    setBoard(placeMines(initializeBoard()));
  }, []);

  return (
    <div className="app-container">
      <div className="game-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className="cell">
                {cell === 'mine' ? <img src={mineImage} alt="Mine" /> : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
