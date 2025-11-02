import { Game } from '../types';

interface GameOverProps {
  game: Game;
  onNewGame: () => void;
}

export function GameOver({ game, onNewGame }: GameOverProps) {
  const { gameState } = game;
  const won = gameState.winner === 'player';

  return (
    <div className="game-over notebook-page">
      <h1 className="notebook-title">
        {won ? '🎉 Победа!' : '😔 Поражение'}
      </h1>
      
      <div className="game-result notebook-line">
        {won ? (
          <p>Вы потопили все корабли противника!</p>
        ) : (
          <p>Все ваши корабли потоплены...</p>
        )}
      </div>

      <button className="notebook-button primary" onClick={onNewGame}>
        Новая игра
      </button>
    </div>
  );
}

