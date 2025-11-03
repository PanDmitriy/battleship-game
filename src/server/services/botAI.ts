import { GameState } from '../../game/types';

const BOARD_SIZE = 10;

export class BotAI {
  private hitQueue: { row: number; col: number }[] = [];

  makeMove(gameState: GameState, difficulty: 'easy' | 'medium' | 'hard'): { row: number; col: number } {
    switch (difficulty) {
      case 'easy':
        return this.makeEasyMove(gameState);
      case 'medium':
        return this.makeMediumMove(gameState);
      case 'hard':
        return this.makeHardMove(gameState);
      default:
        return this.makeEasyMove(gameState);
    }
  }

  private makeEasyMove(gameState: GameState): { row: number; col: number } {
    // Просто случайный ход
    while (true) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      const cell = gameState.playerBoard[row][col];
      
      if (cell !== 'miss' && cell !== 'hit' && cell !== 'sunk') {
        return { row, col };
      }
    }
  }

  private makeMediumMove(gameState: GameState): { row: number; col: number } {
    // Если есть попадание, стреляем рядом
    if (this.hitQueue.length > 0) {
      const move = this.hitQueue.shift()!;
      const cell = gameState.playerBoard[move.row][move.col];
      if (cell !== 'miss' && cell !== 'hit' && cell !== 'sunk') {
        return move;
      }
    }

    // Ищем попадания, чтобы стрелять рядом
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (gameState.playerBoard[row][col] === 'hit') {
          // Добавляем соседние клетки в очередь
          const neighbors = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 },
          ];

          for (const neighbor of neighbors) {
            if (
              neighbor.row >= 0 &&
              neighbor.row < BOARD_SIZE &&
              neighbor.col >= 0 &&
              neighbor.col < BOARD_SIZE
            ) {
              const neighborCell = gameState.playerBoard[neighbor.row][neighbor.col];
              if (neighborCell !== 'miss' && neighborCell !== 'hit' && neighborCell !== 'sunk') {
                if (!this.hitQueue.some(m => m.row === neighbor.row && m.col === neighbor.col)) {
                  this.hitQueue.push(neighbor);
                }
              }
            }
          }
        }
      }
    }

    // Если в очереди есть ходы, используем их
    if (this.hitQueue.length > 0) {
      const move = this.hitQueue.shift()!;
      return move;
    }

    // Иначе случайный ход
    return this.makeEasyMove(gameState);
  }

  private makeHardMove(gameState: GameState): { row: number; col: number } {
    // Улучшенная версия medium с паттернами
    if (this.hitQueue.length > 0) {
      const move = this.hitQueue.shift()!;
      const cell = gameState.playerBoard[move.row][move.col];
      if (cell !== 'miss' && cell !== 'hit' && cell !== 'sunk') {
        return move;
      }
    }

    // Ищем попадания
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (gameState.playerBoard[row][col] === 'hit') {
          // Приоритет: горизонтальные и вертикальные направления
          const directions = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 },
          ];

          for (const dir of directions) {
            if (
              dir.row >= 0 &&
              dir.row < BOARD_SIZE &&
              dir.col >= 0 &&
              dir.col < BOARD_SIZE
            ) {
              const cell = gameState.playerBoard[dir.row][dir.col];
              if (cell !== 'miss' && cell !== 'hit' && cell !== 'sunk') {
                if (!this.hitQueue.some(m => m.row === dir.row && m.col === dir.col)) {
                  this.hitQueue.push(dir);
                }
              }
            }
          }
        }
      }
    }

    if (this.hitQueue.length > 0) {
      const move = this.hitQueue.shift()!;
      return move;
    }

    // Паттерн стрельбы для больших кораблей (шахматная доска, но с большей плотностью)
    const patternMoves = this.getPatternMoves(gameState);
    if (patternMoves.length > 0) {
      return patternMoves[Math.floor(Math.random() * patternMoves.length)];
    }

    return this.makeEasyMove(gameState);
  }

  private getPatternMoves(gameState: GameState): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    
    // Шахматный паттерн с приоритетом на центр
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = gameState.playerBoard[row][col];
        if (cell !== 'miss' && cell !== 'hit' && cell !== 'sunk') {
          // Приоритет центру доски
          const distanceFromCenter = Math.abs(row - 4.5) + Math.abs(col - 4.5);
          const priority = 10 - distanceFromCenter;
          for (let i = 0; i < priority; i++) {
            moves.push({ row, col });
          }
        }
      }
    }

    return moves;
  }

  reset(): void {
    this.hitQueue = [];
  }
}

