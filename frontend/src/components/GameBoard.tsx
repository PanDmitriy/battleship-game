import { useState } from 'react';
import { Game, CellState } from '../types';
import { api } from '../api/api';

const BOARD_SIZE = 10;

interface GameBoardProps {
  game: Game;
  onGameUpdate: (game: Game) => void;
  userId: string;
}

export function GameBoard({ game, onGameUpdate, userId }: GameBoardProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lastBotMove, setLastBotMove] = useState<{ row: number; col: number } | null>(null);

  const { gameState } = game;

  const handleCellClick = async (row: number, col: number, isPlayerBoard: boolean) => {
    if (processing) return;
    if (isPlayerBoard) return; // Нельзя кликать на свое поле
    if (gameState.currentPlayer !== 'player') return;
    
    const cell = gameState.botBoard[row][col];
    if (cell === 'miss' || cell === 'hit' || cell === 'sunk') return;

    setProcessing(true);
    try {
      const result = await api.makeMove(game.id, row, col);
      onGameUpdate(result.game);
      
      if (result.botMove) {
        setLastBotMove(result.botMove);
        setTimeout(() => setLastBotMove(null), 2000);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getCellClass = (cell: CellState, isPlayerBoard: boolean, row: number, col: number): string => {
    let classes = 'board-cell';
    
    if (isPlayerBoard) {
      if (cell === 'ship') classes += ' ship';
      if (cell === 'hit') classes += ' hit';
      if (cell === 'miss') classes += ' miss';
      if (cell === 'sunk') classes += ' sunk';
      if (lastBotMove && lastBotMove.row === row && lastBotMove.col === col) {
        classes += ' last-bot-move';
      }
    } else {
      if (cell === 'hit') classes += ' hit';
      if (cell === 'miss') classes += ' miss';
      if (cell === 'sunk') classes += ' sunk';
    }

    return classes;
  };

  return (
    <div className="game-board notebook-page">
      <h2 className="notebook-heading">Морской бой</h2>
      
      <div className="game-status notebook-line">
        {gameState.currentPlayer === 'player' ? '🎯 Ваш ход' : '🤖 Ход бота...'}
      </div>

      <div className="boards-container">
        <div className="board-section">
          <div className="board-label notebook-line">Ваше поле:</div>
          <div className="board">
            {gameState.playerBoard.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={`player-${rowIndex}-${colIndex}`}
                    className={getCellClass(cell, true, rowIndex, colIndex)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="board-section">
          <div className="board-label notebook-line">Поле противника:</div>
          <div className="board">
            {gameState.botBoard.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={`bot-${rowIndex}-${colIndex}`}
                    className={getCellClass(cell, false, rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex, false)}
                    style={{ cursor: processing ? 'wait' : 'pointer' }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {lastBotMove && (
        <div className="bot-move-notification notebook-line">
          {lastBotMove.hit ? '💥 Бот попал!' : '💨 Бот промахнулся'}
          {lastBotMove.sunk && ' 🚢 Корабль потоплен!'}
        </div>
      )}
    </div>
  );
}

