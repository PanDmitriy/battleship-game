import { Game, GameState, MoveResult, Ship } from '../../game/types';
import { getQuery, runQuery } from '../db';
import { createEmptyBoard, generateRandomShips, placeShipOnBoard, validateShipPlacement } from '../../game/board';
import { BotAI } from './botAI';

export class GameService {
  private botAI: BotAI;

  constructor() {
    this.botAI = new BotAI();
  }

  async createGame(userId: string, botDifficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<Game> {
    // Создаем начальное состояние игры
    const gameState: GameState = {
      playerBoard: createEmptyBoard(),
      botBoard: createEmptyBoard(),
      playerShips: [],
      botShips: generateRandomShips(),
      currentPlayer: 'player',
      gameStatus: 'setup',
      winner: null,
    };

    // Размещаем корабли бота на его доске
    const botBoard = createEmptyBoard();
    for (const ship of gameState.botShips) {
      placeShipOnBoard(botBoard, ship);
    }
    gameState.botBoard = botBoard;

    // Сохраняем в БД
    const gameStateJson = JSON.stringify(gameState);
    const result = await runQuery(
      'INSERT INTO games (user_id, game_state, bot_difficulty) VALUES (?, ?, ?)',
      [userId, gameStateJson, botDifficulty]
    );

    const game: Game = {
      id: result.lastID!,
      userId,
      gameState,
      botDifficulty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return game;
  }

  async getGame(gameId: number): Promise<Game | null> {
    const row = await getQuery<any>(
      'SELECT * FROM games WHERE id = ?',
      [gameId]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      gameState: JSON.parse(row.game_state),
      botDifficulty: row.bot_difficulty,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getActiveGame(userId: string): Promise<Game | null> {
    const row = await getQuery<any>(
      `SELECT * FROM games 
       WHERE user_id = ? 
       AND json_extract(game_state, '$.gameStatus') != 'finished'
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      gameState: JSON.parse(row.game_state),
      botDifficulty: row.bot_difficulty,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async placeShips(gameId: number, ships: Ship[]): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Игра не найдена');
    }

    if (game.gameState.gameStatus !== 'setup') {
      throw new Error('Игра уже началась');
    }

    // Валидация размещения
    if (!validateShipPlacement(ships)) {
      throw new Error('Некорректное размещение кораблей');
    }

    // Размещаем корабли на доске игрока
    const playerBoard = createEmptyBoard();
    for (const ship of ships) {
      placeShipOnBoard(playerBoard, ship);
    }

    game.gameState.playerBoard = playerBoard;
    game.gameState.playerShips = ships;
    game.gameState.gameStatus = 'playing';
    game.updatedAt = new Date().toISOString();

    await this.saveGame(game);
    return game;
  }

  async autoPlaceShips(gameId: number): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Игра не найдена');
    }

    const ships = generateRandomShips();
    return this.placeShips(gameId, ships);
  }

  async makeMove(gameId: number, row: number, col: number): Promise<MoveResult> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Игра не найдена');
    }

    if (game.gameState.gameStatus !== 'playing') {
      throw new Error('Игра не в процессе');
    }

    if (game.gameState.currentPlayer !== 'player') {
      throw new Error('Не ваш ход');
    }

    const { gameState } = game;

    // Проверка, что клетка еще не была атакована
    const cellState = gameState.botBoard[row][col];
    if (cellState === 'miss' || cellState === 'hit' || cellState === 'sunk') {
      throw new Error('Эта клетка уже была атакована');
    }

    // Выполняем ход игрока
    let hit = false;
    let sunk = false;

    if (cellState === 'ship') {
      hit = true;
      gameState.botBoard[row][col] = 'hit';

      // Проверяем, потоплен ли корабль
      const ship = gameState.botShips.find(s => {
        if (s.orientation === 'horizontal') {
          return s.row === row && col >= s.col && col < s.col + s.length;
        } else {
          return s.col === col && row >= s.row && row < s.row + s.length;
        }
      });

      if (ship) {
        ship.hits++;
        if (ship.hits >= ship.length) {
          sunk = true;
          // Отмечаем все клетки корабля как потопленные
          for (let i = 0; i < ship.length; i++) {
            const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
            const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
            gameState.botBoard[shipRow][shipCol] = 'sunk';
          }
        }
      }
    } else {
      gameState.botBoard[row][col] = 'miss';
    }

    // Проверка победы игрока
    const allSunk = gameState.botShips.every(ship => ship.hits >= ship.length);
    let gameOver = false;
    let botMoveResult: { row: number; col: number; hit: boolean; sunk: boolean } | undefined;

    if (allSunk) {
      gameState.gameStatus = 'finished';
      gameState.winner = 'player';
      gameOver = true;
      await this.updateStatistics(game.userId, true);
    } else {
      // Ход бота
      const botMove = this.botAI.makeMove(gameState, game.botDifficulty);
      
      let botHit = false;
      let botSunk = false;

      if (gameState.playerBoard[botMove.row][botMove.col] === 'ship') {
        botHit = true;
        gameState.playerBoard[botMove.row][botMove.col] = 'hit';

        // Проверяем, потоплен ли корабль игрока
        const ship = gameState.playerShips.find(s => {
          if (s.orientation === 'horizontal') {
            return s.row === botMove.row && botMove.col >= s.col && botMove.col < s.col + s.length;
          } else {
            return s.col === botMove.col && botMove.row >= s.row && botMove.row < s.row + s.length;
          }
        });

        if (ship) {
          ship.hits++;
          if (ship.hits >= ship.length) {
            botSunk = true;
            // Отмечаем все клетки корабля как потопленные
            for (let i = 0; i < ship.length; i++) {
              const shipRow = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
              const shipCol = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
              gameState.playerBoard[shipRow][shipCol] = 'sunk';
            }
          }
        }

        // Проверка победы бота
        const playerAllSunk = gameState.playerShips.every(ship => ship.hits >= ship.length);
        if (playerAllSunk) {
          gameState.gameStatus = 'finished';
          gameState.winner = 'bot';
          gameOver = true;
          await this.updateStatistics(game.userId, false);
        }
      } else {
        gameState.playerBoard[botMove.row][botMove.col] = 'miss';
      }

      botMoveResult = {
        row: botMove.row,
        col: botMove.col,
        hit: botHit,
        sunk: botSunk,
      };
    }

    game.updatedAt = new Date().toISOString();
    await this.saveGame(game);

    const result: MoveResult = {
      game,
      hit,
      sunk,
      gameOver,
      botMove: botMoveResult,
    };

    return result;
  }

  private async saveGame(game: Game): Promise<void> {
    const gameStateJson = JSON.stringify(game.gameState);
    await runQuery(
      'UPDATE games SET game_state = ?, updated_at = ? WHERE id = ?',
      [gameStateJson, game.updatedAt, game.id]
    );
  }

  private async updateStatistics(userId: string, win: boolean): Promise<void> {
    // Получаем текущую статистику
    const stats = await getQuery<any>(
      'SELECT * FROM statistics WHERE user_id = ?',
      [userId]
    );

    if (stats) {
      await runQuery(
        'UPDATE statistics SET wins = wins + ?, losses = losses + ?, total_games = total_games + 1 WHERE user_id = ?',
        [win ? 1 : 0, win ? 0 : 1, userId]
      );
    } else {
      await runQuery(
        'INSERT INTO statistics (user_id, wins, losses, total_games) VALUES (?, ?, ?, 1)',
        [userId, win ? 1 : 0, win ? 0 : 1]
      );
    }
  }
}

