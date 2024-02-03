import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './app/store'; 
import { startGame, endGame, winGame, selectGameStarted, selectGameOver, selectGameWon, resetGameStarted, resetGameOver, resetGameWon,
  startTimer, updateTimer, resetTimer,
  changeLevel as changeLevelAction, selectLevel, selectWidth, selectHeight, selectMineCount,
  selectRemainingMines, updateRemainingMines,
  updateCustomGameSettings
  } from './features/game/gameSlice';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import styled from 'styled-components';

const VerticalMiddleTd = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;


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
interface WinModalProps {
  show: boolean;
  onClose: () => void;
  timer: number;
}
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
  const [showWinModal, setShowWinModal] = useState(false);


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
    if (gameStarted && !gameOver && checkWin()) {
      dispatch(winGame());
      dispatch(endGame());
      setShowWinModal(true); 
    }
  }, [openedCells, gameStarted, gameOver, dispatch]);

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

  
  // function initializeOpenedCells(width: number, height: number): OpenedCells {
  //   return Array.from({ length: height }, () =>
  //     Array.from({ length: width }, () => false)
  //   );
  // }
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
  // function isFirstClickAdjacent(row: number, col: number, firstClickRow: number, firstClickCol: number): boolean {
  //   return Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1;
  // }

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

  const [deathMine, setDeathMine] = useState<[number, number] | null>(null);

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
  // 만약 지뢰를 클릭했다면, 해당 지뢰의 위치를 저장하고 모든 지뢰를 보여주며 게임을 종료함
    if (board[row][col] === 'mine') {
      setDeathMine([row, col]); // 이 지뢰가 패배의 원인이 되었습니다.
      revealMines();
      return;
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
    } else if (event.key === 'F2') {
      // New 게임 시작
      event.preventDefault();
      resetGame();
      // 드롭다운 닫기
      if (showMenu) setShowMenu(false);
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


  const resetGame = () => {
    dispatch(resetGameStarted());
    dispatch(resetGameOver());
    dispatch(resetGameWon());
    dispatch(resetTimer());
    setDeathMine(null); 
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

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => {setShow(true);};

  // Custom 게임 설정을 위한 상태 변수 선언
const [customWidth, setCustomWidth] = useState(0);
const [customHeight, setCustomHeight] = useState(0);
const [customMines, setCustomMines] = useState(0);

const handleSubmit = () => {
  const maxWidth = 100;
  const maxHeight = 100;
  const maxMines = Math.floor((customWidth * customHeight) / 3); // 격자칸 수의 1/3 이하
  // 입력값 유효성 검사
  if (
    customWidth > 0 && customWidth <= maxWidth &&
    customHeight > 0 && customHeight <= maxHeight &&
    customMines > 0 && customMines <= maxMines
  ) {
    // updateCustomGameSettings 액션 디스패치
    dispatch(updateCustomGameSettings({
      width: customWidth,
      height: customHeight,
      mineCount: customMines
    }));
    handleClose(); // 모달 닫기
    resetGame();
  } else {
    // 유효하지 않은 입력값 처리
    alert(`Minesweeper dimensions invalid:
→Width: From 8 to 100
→Height: from 8 to 100
→Bombs: 1 to 1/3 of squares`);
  }
};

const elementRef = useRef<HTMLDivElement>(null); // HTMLDivElement 타입을 useRef에 명시적으로 전달

useEffect(() => {
  const adjustMenuPosition = () => {
    // elementRef.current는 게임 보드를 가리키는 DOM 요소입니다.
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const gameMenu = document.querySelector('.game-menu');
      
      if (gameMenu instanceof HTMLElement) {
        // 메뉴의 스타일을 직접 조정합니다.
        gameMenu.style.position = 'absolute';
        gameMenu.style.top = `${rect.top}px`; // 게임 보드의 상단에 위치하도록 설정합니다.
        gameMenu.style.left = `${rect.left + rect.width + 10}px`; // 게임 보드의 오른쪽에 위치하도록 설정합니다.
      }
    }
  };

  // 컴포넌트 마운트 시에 메뉴 위치를 조정합니다.
  adjustMenuPosition();

  // 윈도우 사이즈가 변경될 때마다 메뉴 위치를 다시 조정합니다.
  window.addEventListener('resize', adjustMenuPosition);

  // 컴포넌트 언마운트 시에 이벤트 리스너를 정리합니다.
  return () => {
    window.removeEventListener('resize', adjustMenuPosition);
  };
}, []); // 빈 의존성 배열은 컴포넌트가 마운트되고 언마운트될 때만 useEffect를 실행하게 합니다.

function WinModal({ show, onClose, timer }: WinModalProps) {
  return (
    <Modal show={show} onHide={onClose} className="custom-modal">
      <Modal.Header>
        <Modal.Title><h4 style={{ fontWeight: '600'}}>Congratulations!</h4></Modal.Title>
      </Modal.Header>
      ⠀Congratulations on winning Minesweeper
      <Modal.Body>Game time: {String(timer).padStart(3, '0')} seconds!</Modal.Body>
      <Modal.Footer>
        <Button className='custom-btn' onClick={onClose}>
          CLOSE
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
useEffect(() => {
  if (timer >= 999) {
    dispatch(endGame()); 
    setShowWinModal(false);
  }
}, [timer, dispatch]);

  return (
    <div 
      className="app-container" 
      onKeyDown={handleKeyDown} 
      tabIndex={0} // 여기에 tabIndex를 추가하여 키보드 이벤트를 받을 수 있도록
    >
      <div className='mini-game'>
        <div className='mini-game-nav'>
          <a onClick={toggleMenu} style={{cursor: 'pointer'}}>Gameㅤ</a>
          <a style={{cursor: 'pointer'}}>Optionsㅤ</a>
          <a style={{cursor: 'pointer'}}>Help</a>
        </div>
        
      <header className="game-header">
      {showMenu && (
          <div className="game-menu active">
            {/* // <div className={`game-menu ${showMenu ? 'active' : ''}`}> */}
              <ul className="game-menu-ul">
                <li onClick={() => {resetGame(); setShowMenu(false);}} style={{borderBottom: '2px solid #7B7B7B' , padding: '4px 8px'}}>New (F2)</li>
                <li onClick={() => {changeLevel('beginner'); setShowMenu(false);}} style={{ padding: '4px 8px' }}>Beginner</li>
                <li onClick={() => {changeLevel('intermediate'); setShowMenu(false);}} style={{ padding: '4px 8px' }}>Intermediate</li>
                <li onClick={() => {changeLevel('expert'); setShowMenu(false);}}style={{ padding: '4px 8px' }}>Expert</li>
                <li onClick={() => {handleShow();}} style={{borderBottom: '2px solid #7B7B7B', padding: '4px 8px'}} >Custom</li>
                <Modal show={show} onHide={handleClose} className='custom-modal'>
                  <Modal.Header closeButton onClick={()=>{setShowMenu(false)}}>
                    <Modal.Title><h4>Custom Game Setup</h4></Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <div style={{marginLeft: '30px', marginTop: '-20px', marginBottom: '-20px'}}>
                      <VerticalMiddleTd>Game Height:ㅤㅤ ㅤ
                      <input
                        type="text"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                        style={{width: '90px'}}
                      />
                      </VerticalMiddleTd>
                      <VerticalMiddleTd>Game width: ㅤ ㅤ ㅤ
                      <input
                        type="text"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                        style={{width: '90px'}}
                      />
                      </VerticalMiddleTd>
                      <VerticalMiddleTd>
                      Number of Bombs:ㅤ
                      <input
                        type="text"
                        value={customMines}
                        onChange={(e) => setCustomMines(Number(e.target.value))}
                        style={{width: '90px'}}
                      />
                        </VerticalMiddleTd>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    
                    <Button className='custom-btn' onClick={() => {handleSubmit(); setShowMenu(false);}}>
                      OK
                    </Button>
                  </Modal.Footer>
                </Modal>
                <li style={{borderBottom: '2px solid #7B7B7B', padding: '4px 8px'}}>Personal Best</li>
                <li style={{borderBottom: '2px solid #7B7B7B', padding: '4px 8px'}}>Exit</li>
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
      <div className="game-board" ref={elementRef} >
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, cellIndex) => {
              // 숫자에 따라 클래스 이름을 결정합니다.
              const cellClass = typeof cell === 'number' && cell > 0 ? `cell-${cell}` : '';
              const isDeathMine = deathMine && deathMine[0] === rowIndex && deathMine[1] === cellIndex;
              return (
                <div
                  key={cellIndex}
                  className={`cell ${openedCells[rowIndex][cellIndex] ? 'opened' : ''} ${flaggedCells[rowIndex][cellIndex] ? 'flagged' : ''} ${cellClass}`}
                  onClick={() => openCell(rowIndex, cellIndex)}
                  onContextMenu={(event) => { event.preventDefault(); toggleFlag(rowIndex, cellIndex); }}
                  onMouseEnter={() => handleCellMouseEnter(rowIndex, cellIndex)}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  {/* 깃발 표시 로직 */}
                  {isDeathMine
                    ? <img src="https://freeminesweeper.org/images/bombdeath.gif" alt="Death Mine" />
                    : flaggedCells[rowIndex][cellIndex] && !openedCells[rowIndex][cellIndex]
                    ? <img src={flagImage} alt="Flag" style={{ width: '20px', height: '20px' }} />
                    : openedCells[rowIndex][cellIndex]
                      ? (cell === 'mine'
                        ? <img src={mineImage} alt="Mine" />
                        : typeof cell === 'number' && cell > 0
                          ? cell
                          : '')
                      : <img src={blankCellImage} alt="Blank" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </div>
      <WinModal show={showWinModal} onClose={() => setShowWinModal(false)}  timer={timer}/>
    </div>
  );
}

export default App;