import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const dbPath = path.join(import.meta.dirname, 'velodom.db');
const schemaPath = path.join(import.meta.dirname, 'schema.sql');

// открываем файл базы; если его нет, SQLite создаст пустой
export const db = new DatabaseSync(dbPath);

// включаем проверку ссылок REFERENCES (в SQLite она по умолчанию выключена)
db.exec('PRAGMA foreign_keys = ON;');

// выполняем схему: создаются таблицы, которых ещё нет
db.exec(readFileSync(schemaPath, 'utf8'));