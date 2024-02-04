import React from 'react';

interface CellProps {
    cellValue: 'empty' | 'mine' | number;
    isOpened: boolean;
    isFlagged: boolean;
    isDeathMine?: boolean | null;
    onClick: () => void;
    onContextMenu: (event: React.MouseEvent) => void;
    onMouseEnter: () => void;
}

const Cell: React.FC<CellProps> = React.memo(({ cellValue, isOpened, isFlagged, isDeathMine, onClick, onContextMenu, onMouseEnter }) => {
    const cellClass = typeof cellValue === "number" && cellValue > 0 ? `cell-${cellValue}` : "";
    const content = isOpened ? (
        isDeathMine ? (
            <img src="https://freeminesweeper.org/images/bombdeath.gif" alt="Death Mine" />
        ) : cellValue === "mine" ? (
            <img src="https://freeminesweeper.org/images/bombrevealed.gif" alt="Mine" />
        ) : typeof cellValue === "number" && cellValue > 0 ? (
            cellValue
        ) : (
            ""
        )
    ) : isFlagged ? (
        <img src="https://freeminesweeper.org/images/bombflagged.gif" alt="Flag" style={{ width: "20px", height: "20px" }} />
    ) : (
        <img src="https://freeminesweeper.org/images/blank.gif" alt="Blank" />
    );


    return (
        <div
        className={`cell ${isOpened ? 'opened' : ''} ${isFlagged ? 'flagged' : ''} ${cellClass}`}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={onMouseEnter}
        style={{ cursor: 'pointer' }}
        >
        {content}
        </div>
    );
});

export default Cell;
