import { CellState, Ship, ShipType } from './types';

const BOARD_SIZE = 10;

export const SHIP_TYPES: Record<ShipType, number> = {
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

export function createEmptyBoard(): CellState[][] {
  return Array(BOARD_SIZE).fill(null).map(() => 
    Array(BOARD_SIZE).fill('empty' as CellState)
  );
}

export function placeShipOnBoard(
  board: CellState[][],
  ship: Ship
): boolean {
  const { row, col, orientation, length } = ship;

  // Проверка границ
  if (orientation === 'horizontal') {
    if (col + length > BOARD_SIZE) return false;
  } else {
    if (row + length > BOARD_SIZE) return false;
  }

  // Проверка пересечений и соседних клеток
  for (let i = 0; i < length; i++) {
    const checkRow = orientation === 'horizontal' ? row : row + i;
    const checkCol = orientation === 'horizontal' ? col + i : col;

    // Проверка самой клетки
    if (board[checkRow][checkCol] === 'ship') return false;

    // Проверка соседних клеток
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const neighborRow = checkRow + dr;
        const neighborCol = checkCol + dc;

        if (
          neighborRow >= 0 &&
          neighborRow < BOARD_SIZE &&
          neighborCol >= 0 &&
          neighborCol < BOARD_SIZE &&
          board[neighborRow][neighborCol] === 'ship'
        ) {
          return false;
        }
      }
    }
  }

  // Размещение корабля
  for (let i = 0; i < length; i++) {
    const placeRow = orientation === 'horizontal' ? row : row + i;
    const placeCol = orientation === 'horizontal' ? col + i : col;
    board[placeRow][placeCol] = 'ship';
  }

  return true;
}

export function generateRandomShips(): Ship[] {
  const board = createEmptyBoard();
  const ships: Ship[] = [];
  const shipTypes: ShipType[] = ['destroyer', 'cruiser', 'battleship', 'carrier'];

  for (const shipType of shipTypes) {
    const count = SHIP_COUNTS[shipType];
    const length = SHIP_TYPES[shipType];

    for (let i = 0; i < count; i++) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 1000) {
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        const orientation: 'horizontal' | 'vertical' = Math.random() > 0.5 ? 'horizontal' : 'vertical';

        const ship: Ship = {
          type: shipType,
          length,
          row,
          col,
          orientation,
          hits: 0,
        };

        if (placeShipOnBoard(board, ship)) {
          ships.push(ship);
          placed = true;
        }

        attempts++;
      }

      if (!placed) {
        throw new Error(`Не удалось разместить корабль ${shipType}`);
      }
    }
  }

  return ships;
}

export function validateShipPlacement(ships: Ship[]): boolean {
  const board = createEmptyBoard();
  
  // Проверка количества кораблей
  const shipCounts: Record<ShipType, number> = {
    destroyer: 0,
    cruiser: 0,
    battleship: 0,
    carrier: 0,
  };

  for (const ship of ships) {
    shipCounts[ship.type]++;
    if (shipCounts[ship.type] > SHIP_COUNTS[ship.type]) {
      return false;
    }

    if (!placeShipOnBoard(board, ship)) {
      return false;
    }
  }

  return true;
}

