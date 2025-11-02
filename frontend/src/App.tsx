import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { ShipPlacement } from './components/ShipPlacement';
import { GameSetup } from './components/GameSetup';
import { GameOver } from './components/GameOver';
import { Game, GameState } from './types';
import { api } from './api/api';

// Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    // Загрузка активной игры при старте
    loadActiveGame();
  }, []);

  const getUserId = (): string => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
    // Fallback для локальной разработки
    return localStorage.getItem('userId') || 'dev-user-' + Date.now();
  };

  const loadActiveGame = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      const activeGame = await api.getActiveGame(userId);
      if (activeGame) {
        setGame(activeGame);
      }
    } catch (err: any) {
      console.error('Ошибка загрузки игры:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      localStorage.setItem('userId', userId);
      const newGame = await api.createGame(userId, botDifficulty);
      setGame(newGame);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания игры');
      console.error('Ошибка создания игры:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGameUpdate = (updatedGame: Game) => {
    setGame(updatedGame);
  };

  if (loading && !game) {
    return (
      <div className="app-loading">
        <div className="notebook-line">Загрузка...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <GameSetup
        botDifficulty={botDifficulty}
        onDifficultyChange={setBotDifficulty}
        onStart={createNewGame}
        error={error}
      />
    );
  }

  const gameState = game.gameState;

  if (gameState.gameStatus === 'setup') {
    return (
      <ShipPlacement
        game={game}
        onShipsPlaced={handleGameUpdate}
        onAutoPlace={async () => {
          const updated = await api.autoPlaceShips(game.id);
          handleGameUpdate(updated);
        }}
      />
    );
  }

  if (gameState.gameStatus === 'finished') {
    return (
      <GameOver
        game={game}
        onNewGame={() => {
          setGame(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <GameBoard
      game={game}
      onGameUpdate={handleGameUpdate}
      userId={getUserId()}
    />
  );
}

export default App;

