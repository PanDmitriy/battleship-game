import { Game, Ship, MoveResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async createGame(userId: string, botDifficulty: 'easy' | 'medium' | 'hard'): Promise<Game> {
    const response = await fetch(`${API_BASE}/game/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, botDifficulty }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка создания игры');
    }

    return response.json();
  },

  async getGame(gameId: number): Promise<Game> {
    const response = await fetch(`${API_BASE}/game/${gameId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка получения игры');
    }

    return response.json();
  },

  async getActiveGame(userId: string): Promise<Game | null> {
    try {
      const response = await fetch(`${API_BASE}/game/active/${userId}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Ошибка получения активной игры');
      }
      return response.json();
    } catch (error) {
      return null;
    }
  },

  async placeShips(gameId: number, ships: Ship[]): Promise<Game> {
    const response = await fetch(`${API_BASE}/game/${gameId}/ships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ships }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка размещения кораблей');
    }

    return response.json();
  },

  async autoPlaceShips(gameId: number): Promise<Game> {
    const response = await fetch(`${API_BASE}/game/${gameId}/auto-place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка автоматического размещения');
    }

    return response.json();
  },

  async makeMove(gameId: number, row: number, col: number): Promise<MoveResult> {
    const response = await fetch(`${API_BASE}/game/${gameId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row, col }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка хода');
    }

    return response.json();
  },
};

