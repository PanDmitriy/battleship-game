import { useState } from 'react';
import { Game, Ship, ShipType, ShipOrientation } from '../types';
import { api } from '../api/api';

const BOARD_SIZE = 10;
const SHIP_TYPES: Record<ShipType, number> = {
  destroyer: 2,
  cruiser: 3,
  battleship: 4,
  carrier: 5,
};
const SHIP_COUNTS: Record<ShipType, number> = {
  destroyer: 1,
  cruiser: 2,
  battleship: 1,
  carrier: 1,
};

interface ShipPlacementProps {
  game: Game;
  onShipsPlaced: (game: Game) => void;
  onAutoPlace: () => Promise<void>;
}

export function ShipPlacement({ game, onShipsPlaced, onAutoPlace }: ShipPlacementProps) {
  const [board, setBoard] = useState<(boolean | null)[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [ships, setShips] = useState<Ship[]>([]);
  const [selectedShip, setSelectedShip] = useState<{ type: ShipType; index: number } | null>(null);
  const [orientation, setOrientation] = useState<ShipOrientation>('horizontal');

  const getRemainingShips = () => {
    const counts: Record<ShipType, number> = { destroyer: 0, cruiser: 0, battleship: 0, carrier: 0 };
    ships.forEach(ship => counts[ship.type]++);
    return Object.entries(SHIP_COUNTS).map(([type, needed]) => ({
      type: type as ShipType,
      remaining: needed - counts[type as ShipType],
      length: SHIP_TYPES[type as ShipType],
    }));
  };

  const handleCellClick = (row: number, col: number) => {
    if (!selectedShip) return;

    const shipType = selectedShip.type;
    const length = SHIP_TYPES[shipType];
    
    // Проверка границ
    if (orientation === 'horizontal' && col + length > BOARD_SIZE) return;
    if (orientation === 'vertical' && row + length > BOARD_SIZE) return;

    // Проверка занятости
    for (let i = 0; i < length; i++) {
      const checkRow = orientation === 'vertical' ? row + i : row;
      const checkCol = orientation === 'horizontal' ? col + i : col;
      if (board[checkRow][checkCol] === true) return;

      // Проверка соседних клеток
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const neighborRow = checkRow + dr;
          const neighborCol = checkCol + dc;
          if (
            neighborRow >= 0 && neighborRow < BOARD_SIZE &&
            neighborCol >= 0 && neighborCol < BOARD_SIZE &&
            board[neighborRow][neighborCol] === true
          ) {
            return;
          }
        }
      }
    }

    // Размещение корабля
    const newBoard = board.map(row => [...row]);
    for (let i = 0; i < length; i++) {
      const placeRow = orientation === 'vertical' ? row + i : row;
      const placeCol = orientation === 'horizontal' ? col + i : col;
      newBoard[placeRow][placeCol] = true;
    }

    const newShip: Ship = {
      type: shipType,
      length,
      row,
      col,
      orientation,
      hits: 0,
    };

    const newShips = [...ships, newShip];
    setShips(newShips);
    setBoard(newBoard);
    setSelectedShip(null);
  };

  const removeShip = (index: number) => {
    const ship = ships[index];
    const newBoard = board.map(row => [...row]);
    
    for (let i = 0; i < ship.length; i++) {
      const row = ship.orientation === 'vertical' ? ship.row + i : ship.row;
      const col = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
      newBoard[row][col] = null;
    }

    setBoard(newBoard);
    setShips(ships.filter((_, i) => i !== index));
  };

  const handlePlaceShips = async () => {
    if (ships.length !== 5) {
      alert('Разместите все корабли!');
      return;
    }

    try {
      const updatedGame = await api.placeShips(game.id, ships);
      onShipsPlaced(updatedGame);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const remainingShips = getRemainingShips();

  return (
    <div className="ship-placement notebook-page">
      <h2 className="notebook-heading">Разместите корабли</h2>
      
      <div className="placement-controls">
        <div className="ship-selector">
          <h3 className="notebook-subheading">Выберите корабль:</h3>
          {remainingShips.map(({ type, remaining, length }) => (
            remaining > 0 && (
              <button
                key={type}
                className={`notebook-button ship-button ${selectedShip?.type === type ? 'active' : ''}`}
                onClick={() => {
                  const index = ships.filter(s => s.type === type).length;
                  setSelectedShip({ type, index });
                }}
              >
                {type} ({length} клеток) - осталось: {remaining}
              </button>
            )
          ))}
        </div>

        <div className="orientation-control">
          <button
            className={`notebook-button ${orientation === 'horizontal' ? 'active' : ''}`}
            onClick={() => setOrientation('horizontal')}
          >
            →
          </button>
          <button
            className={`notebook-button ${orientation === 'vertical' ? 'active' : ''}`}
            onClick={() => setOrientation('vertical')}
          >
            ↓
          </button>
        </div>
      </div>

      <div className="placement-board-container">
        <div className="board-label notebook-line">Ваше поле:</div>
        <div className="board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`board-cell ${cell === true ? 'ship' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="placed-ships">
        <h3 className="notebook-subheading">Размещенные корабли:</h3>
        {ships.map((ship, index) => (
          <div key={index} className="placed-ship-item notebook-line">
            {ship.type} в ({ship.row}, {ship.col}) - {ship.orientation}
            <button className="notebook-button small" onClick={() => removeShip(index)}>
              Удалить
            </button>
          </div>
        ))}
      </div>

      <div className="placement-actions">
        <button className="notebook-button" onClick={onAutoPlace}>
          Автоматическое размещение
        </button>
        <button
          className="notebook-button primary"
          onClick={handlePlaceShips}
          disabled={ships.length !== 5}
        >
          Начать игру
        </button>
      </div>
    </div>
  );
}

