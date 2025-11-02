import express from 'express';
import { config } from 'dotenv';
import { initDatabase } from './db';
import { setupBot } from '../bot/bot';
import gameRoutes from './routes/game';
import cors from 'cors';

config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors());
app.use(express.json());

// В режиме разработки не раздаем статику - это делает Vite
// В продакшене раздаем собранные файлы из frontend/dist
if (NODE_ENV === 'production') {
  app.use(express.static('frontend/dist'));
}

// API routes
app.use('/api/game', gameRoutes);

// Инициализация базы данных
initDatabase()
  .then(() => {
    console.log('✅ База данных инициализирована');
    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });

    // Запуск Telegram бота
    setupBot();
  })
  .catch((error) => {
    console.error('❌ Ошибка инициализации:', error);
    process.exit(1);
  });

