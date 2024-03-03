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
import Cell from './Cell';
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

// 각 레벨에 따른 게임 보드 크기와 지뢰 수 설정 -> gameSlice.ts 로 옮김
// const levels: Record<Level, LevelConfig> = {
//   beginner: { width: 8, height: 8, mines: 10 },
//   intermediate: { width: 16, height: 16, mines: 40 },
//   expert: { width: 32, height: 16, mines: 100 }, // 예를 들어 expert는 직사각형 게임 보드
// };
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
      // localStorage에 난이도 저장
    localStorage.setItem('minesweeperLevel', newLevel);
  };

  useEffect(() => {
    // localStorage에서 난이도 불러오기
    const savedLevel = localStorage.getItem('minesweeperLevel');
    if (savedLevel) {
      dispatch(changeLevelAction(savedLevel as Level));
    }
  }, [dispatch]);
  
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
    //setTimeout과는 다르게 함수를 한번만 실행하는 것이 아니라 부여된 시간 간격 이후로 주기적으로 실행합니다. 
    //만약 계속 호출하는 것을 멈추고 싶다면, clearInterval(timerId)를 호출해야 합니다.
    return () => {
        if (intervalId) clearInterval(intervalId); //언마운트 또는 값 변경될 때 중지됨
    };
}, [gameStarted, gameOver, gameWon, dispatch]);


  //게임 이기는 조건 체크
  useEffect(() => {
    if (gameStarted && !gameOver && checkWin()) {
      dispatch(winGame());
      dispatch(endGame());
      }
  }, [openedCells, gameStarted, gameOver])

  //지뢰 배치 함수
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


  //문제가 있던 함수 !!
  //3. "(0,0) 부터 현재 cell을 감싼 모든 cell의 값을 확인하고 1 (지뢰)의 수를 세어 값을 넣는다."
  //6. "값이 0인 cell의 위치만 저장하는 배열을 만들어 push 한다."
  function calculateMines(board: Board): Board {
    let tempZeroCells: ZeroCells = []; // 0 값을 갖는 셀의 위치를 임시 저장할 배열

    // 현재 셀을 중심으로 주변 8개 셀의 상대적 위치. 
    // [-1, -1]은 현재 셀의 왼쪽 위 대각선에 있는 셀을 가리키고
    // [1, 1]은 오른쪽 아래 대각선에 있는 셀을 가리킴
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    //순회
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (board[row][col] === 'mine') continue;

        let mineCount = 0;
        for (let [dx, dy] of directions) {
          const newRow = row + dx, newCol = col + dy; //각 방향에 대해 새로운 행이랑 열 위치 계산
          // 만약 새로운 위치가 보드의 유효한 범위 내에 있고, 그 위치에 지뢰가 있다면
          if (newRow >= 0 && newRow < height && newCol >= 0 && newCol < width  && board[newRow][newCol] === 'mine') {
            mineCount++;
          }
        }
        // 해당 셀을 클릭했을 때  주변에 몇 개의 지뢰가 있는지 보여줌
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

  //게임이 끝났을 때 (졌을 때)
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
          return false; // 닫힌 비지뢰 칸이 있다면 게임 승리 아님
        }
      }
    }
    return true; //모든 비지뢰 칸이 열렸다면 게임 승리
  }

  const [deathMine, setDeathMine] = useState<[number, number] | null>(null);

  // 4. "click한 cell 주위 모든 cell을 열어볼 수 있도록 한다."
  // 5. "click 한 주위 cell 중 값이 0인 cell만 열리도록 한다" - BFS 알고리즘 *기억*
  // 7. "click한 cell 주변에 0이 있다면,또  값이 0인 cell 주변에 또 0이 있는지 찾아 배열에 push한다."
  function openCell(row: number, col: number) {
    const newOpenedCells = openedCells.map(row => [...row]); //현재 열려 있는 셀들의 상태를 복사

    // 탐색을 시작할 위치(사용자가 클릭한 셀)를 큐에 추가 
    const queue = [[row, col]];
  
    //큐에 아직 처리할 셀이 남아있는 동안 탐색 함
    while (queue.length > 0) {
      // 큐에서 다음 셀을 꺼냄 이 셀이 현재 처리할 셀
      const current = queue.shift();
      if (!current) continue;

      const [currentRow, currentCol] = current;
  
      if (!newOpenedCells[currentRow][currentCol]) { //현재 셀이 아직 열리지 않았다면
        newOpenedCells[currentRow][currentCol] = true; //셀을 열고 주변 셀 탐색
  
        if (board[currentRow][currentCol] === 0) { //현재 셀이 '0' (즉, 주변에 지뢰가 없으면) 주변 셀 탐색
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
              // 유효한 범위 내에 있고 아직 열리지 않은 셀을 큐에 추가
              //queue.push([newRow, newCol]);
              newOpenedCells[newRow][newCol] = true; // 셀을 열고
              if (board[newRow][newCol] === 0) {
                queue.push([newRow, newCol]); // 주변에 지뢰가 없는 셀만 큐에 추가
              }
          
            }
          });
        }
      }
    }

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
      setDeathMine([row, col]); // 이 지뢰가 패배의 원인이 되었다는 것을 알림
      revealMines();
      return;
    }
    if (openedCells[row][col] || flaggedCells[row][col] || gameOver) return;

    // 만약 지뢰를 클릭했다면, 모든 지뢰를 보여주고 게임을 종료합니다.
    if (board[row][col] === 'mine') {
      revealMines();
      return;
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

  //깃발 꽂기 - 스페이스바
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

  //깃발 꽂기
  function toggleFlag(row: number, col: number) {
    const newFlaggedCells = flaggedCells.map((rowArray, rowIndex) =>  //순회
      rowArray.map((cell, colIndex) => 
        rowIndex === row && colIndex === col ? !cell : cell
        // 현재 순회 중인 셀의 위치가 사용자가 클릭한 셀의 위치(row, col)와 일치하는지 확인
        // 일치한다면, 현재 셀의 깃발 상태를 반전(!cell)시킵니다.
        // 즉, 깃발이 없었다면 깃발을 추가하고, 이미 깃발이 있었다면 깃발을 제거합니다. 
        //일치하지 않는 셀에 대해서는 기존의 상태(cell)를 유지합니다.
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

// 모달창 custom 관련
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

// React 컴포넌트의 라이프사이클 동안 특정 돔 요소(elementRef.current)의 위치를 조정하고, 윈도우 크기가 변경될 때마다 이 위치를 업데이트하는 데 사용됩니다. 여기서 useEffect는 컴포넌트가 마운트되었을 때와 언마운트될 때 실행되도록 설정되어 있습니다.
const elementRef = useRef<HTMLDivElement>(null); // HTMLDivElement 타입을 useRef에 명시적으로 전달
//useRef는 DOM 요소에 직접적인 참조를 생성하는 데 사용
//여기서는 HTMLDivElement 타입의 참조를 생성하여, 특정 <div> 요소를 직접 조작할 수 있게 합니다.

useEffect(() => {
  // adjustMenuPosition 함수는 elementRef.current가 참조하는 DOM 요소의 위치 정보를 이용하여 게임 메뉴의 스타일을 직접 조정합니다.

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
              <ul className="game-menu-ul">
                <li onClick={() => {resetGame(); setShowMenu(false);}} style={{borderBottom: '2px solid #7B7B7B' , padding: '4px 8px'}}>New (F2)</li>
                <li onClick={() => {changeLevel('beginner'); setShowMenu(false);}} style={{ padding: '4px 8px' }}>Beginner</li>
                <li onClick={() => {changeLevel('intermediate'); setShowMenu(false);}} style={{ padding: '4px 8px' }}>Intermediate</li>
                <li onClick={() => {changeLevel('expert'); setShowMenu(false);}}style={{ padding: '4px 8px' }}>Expert</li>
                <li onClick={() => {handleShow();}} style={{borderBottom: '2px solid #7B7B7B', padding: '4px 8px'}} >Custom</li>
                <Modal show={show} onHide={handleClose} className='custom-modal'>
                  <Modal.Header closeButton onClick={()=>{setShowMenu(false)}}>
                    <Modal.Title><h4 style={{fontWeight: '600'}}>Custom Game Setup</h4></Modal.Title>
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
        <img 
          className="reset-button" 
          src={resetButtonImage} 
          alt="Reset Game"
          onClick={resetGame}
        />
        <div className="timer">
          {String(timer).padStart(3, '0')}
        </div>
      </header>
      <div className="game-board" ref={elementRef} >
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, cellIndex) => {
              const isOpened = openedCells[rowIndex][cellIndex];
              const isFlagged = flaggedCells[rowIndex][cellIndex];
              //지뢰를 클릭했을 때 해당 지뢰가 게임에서 패배의 원인이 되었는지 여부
              const isDeathMine = deathMine && (deathMine[0] === rowIndex) && (deathMine[1] === cellIndex);
              
              return (
                <Cell
                  key={cellIndex}
                  cellValue={cell}
                  isOpened={isOpened}
                  isFlagged={isFlagged}
                  isDeathMine={isDeathMine}
                  onClick={() => openCell(rowIndex, cellIndex)}
                  onContextMenu={(event) => { event.preventDefault(); toggleFlag(rowIndex, cellIndex); }}
                  onMouseEnter={() => handleCellMouseEnter(rowIndex, cellIndex)}
                />
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

export default App;

