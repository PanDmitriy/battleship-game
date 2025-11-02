// Экспорт типов из общей папки types (или можно скопировать)
export type CellState = 'empty' | 'ship' | 'miss' | 'hit' | 'sunk';

export type ShipType = 'destroyer' | 'cruiser' | 'battleship' | 'carrier';
export type ShipOrientation = 'horizontal' | 'vertical';

export interface Ship {
  type: ShipType;
  length: number;
  row: number;
  col: number;
  orientation: ShipOrientation;
  hits: number;
}

export interface GameState {
  playerBoard: CellState[][];
  botBoard: CellState[][];
  playerShips: Ship[];
  botShips: Ship[];
  currentPlayer: 'player' | 'bot';
  gameStatus: 'setup' | 'playing' | 'finished';
  winner: 'player' | 'bot' | null;
}

export interface Game {
  id: number;
  userId: string;
  gameState: GameState;
  botDifficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt: string;
}

export interface MoveResult {
  game: Game;
  hit: boolean;
  sunk: boolean;
  gameOver: boolean;
  botMove?: {
    row: number;
    col: number;
    hit: boolean;
    sunk: boolean;
  };
}

