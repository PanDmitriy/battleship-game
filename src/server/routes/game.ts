import { Router } from 'express';
import { GameService } from '../services/gameService';

const router = Router();
const gameService = new GameService();

// Создать новую игру
router.post('/create', async (req, res) => {
  try {
    const { userId, botDifficulty = 'medium' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId обязателен' });
    }

    const game = await gameService.createGame(userId, botDifficulty);
    res.json(game);
  } catch (error: any) {
    console.error('Ошибка создания игры:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить активную игру пользователя
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const game = await gameService.getActiveGame(userId);
    
    if (!game) {
      return res.status(404).json({ error: 'Активная игра не найдена' });
    }

    res.json(game);
  } catch (error: any) {
    console.error('Ошибка получения активной игры:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить игру
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await gameService.getGame(parseInt(gameId));
    
    if (!game) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    res.json(game);
  } catch (error: any) {
    console.error('Ошибка получения игры:', error);
    res.status(500).json({ error: error.message });
  }
});

// Разместить корабли
router.post('/:gameId/ships', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { ships } = req.body;

    if (!ships || !Array.isArray(ships)) {
      return res.status(400).json({ error: 'ships должен быть массивом' });
    }

    const game = await gameService.placeShips(parseInt(gameId), ships);
    res.json(game);
  } catch (error: any) {
    console.error('Ошибка размещения кораблей:', error);
    res.status(500).json({ error: error.message });
  }
});

// Сделать ход
router.post('/:gameId/move', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { row, col } = req.body;

    if (typeof row !== 'number' || typeof col !== 'number') {
      return res.status(400).json({ error: 'row и col должны быть числами' });
    }

    const result = await gameService.makeMove(parseInt(gameId), row, col);
    res.json(result);
  } catch (error: any) {
    console.error('Ошибка хода:', error);
    res.status(500).json({ error: error.message });
  }
});

// Автоматическое размещение кораблей
router.post('/:gameId/auto-place', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await gameService.autoPlaceShips(parseInt(gameId));
    res.json(game);
  } catch (error: any) {
    console.error('Ошибка автоматического размещения:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

