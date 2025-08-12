import express from 'express';
import cors from 'cors';
// Импортируем lowdb
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// --- Настройка базы данных ---
// Указываем, что наша база данных будет храниться в файле db.json
const adapter = new JSONFile('db.json');
const defaultData = { profiles: [] }; // Структура данных по умолчанию
const db = new Low(adapter, defaultData);

// Читаем данные из файла. Это нужно сделать один раз при старте сервера.
await db.read();

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: 'https://https://qosilim.vercel.app/', // <-- ВАШ URL С VERCEL
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));
app.use(express.json());

// --- ИЗМЕНЕНИЕ ЗДЕСЬ: Новый маршрут для получения всех профилей ---
app.get('/api/profiles', (req, res) => {
  // Просто отправляем все профили из базы данных
  res.status(200).json(db.data.profiles);
});

// --- Логика API теперь работает с базой данных ---
app.post('/api/profile', async (req, res) => {
  console.log('Получены данные профиля на сервере:', req.body);
  
  const newProfile = req.body;
  
  // Ищем, есть ли уже профиль этого пользователя
  const existingProfile = db.data.profiles.find(p => p.userId === newProfile.userId);

  if (existingProfile) {
    // Если есть - обновляем его
    Object.assign(existingProfile, newProfile);
    console.log(`Профиль для userId: ${newProfile.userId} обновлен.`);
  } else {
    // Если нет - добавляем новый
    db.data.profiles.push(newProfile);
    console.log(`Профиль для userId: ${newProfile.userId} создан.`);
  }

  // --- Самое важное: сохраняем изменения в файл db.json ---
  await db.write();

  res.status(200).json({ message: 'Профиль успешно сохранен в базу данных!' });
});

// Запускаем сервер
app.listen(port, () => {
  console.log(`Backend-сервер с базой данных запущен на http://localhost:${port}`);
});