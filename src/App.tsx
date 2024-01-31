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
  }

  function handleContextMenu(event: React.MouseEvent, row: number, col: number) {
    event.preventDefault();
    toggleFlag(row, col);
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
                  ? <img src={flagImage} alt="Flag" />
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