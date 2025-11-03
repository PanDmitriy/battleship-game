import { useState } from 'react';

interface GameSetupProps {
  botDifficulty: 'easy' | 'medium' | 'hard';
  onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onStart: () => void;
  error: string | null;
}

export function GameSetup({ botDifficulty, onDifficultyChange, onStart, error }: GameSetupProps) {
  return (
    <div className="game-setup notebook-page">
      <h1 className="notebook-title">🚢 Морской бой</h1>
      
      <div className="setup-content">
        <div className="setup-section">
          <h2 className="notebook-heading">Выберите сложность:</h2>
          <div className="difficulty-buttons">
            <button
              className={`notebook-button ${botDifficulty === 'easy' ? 'active' : ''}`}
              onClick={() => onDifficultyChange('easy')}
            >
              🟢 Легкая
            </button>
            <button
              className={`notebook-button ${botDifficulty === 'medium' ? 'active' : ''}`}
              onClick={() => onDifficultyChange('medium')}
            >
              🟡 Средняя
            </button>
            <button
              className={`notebook-button ${botDifficulty === 'hard' ? 'active' : ''}`}
              onClick={() => onDifficultyChange('hard')}
            >
              🔴 Сложная
            </button>
          </div>
        </div>

        {error && <div className="error-message notebook-line">{error}</div>}

        <button className="notebook-button primary" onClick={onStart}>
          Начать игру
        </button>
      </div>
    </div>
  );
}


