import React from 'react';
import './App.css';

// 셀의 상태를 나타내는 타입 정의
type Cell = 'empty' | 'mine';

// 게임 보드 타입 정의
type Board = Cell[][];

function App() {
  // 8x8 게임 보드 생성
  const boardSize = 8;
  const board: Board = Array.from({ length: boardSize }, () => 
    Array.from({ length: boardSize }, () => 'empty' as Cell)
  );

  return (
    <div className="app-container">
      <div className="game-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className="cell">
                {/* 여기에 각 셀의 내용을 표시할 수 있습니다 */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;