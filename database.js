
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Criação da tabela de livros
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS livros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            autor TEXT NOT NULL,
            isbn TEXT UNIQUE,
            ano_publicacao INTEGER NOT NULL,
            genero TEXT NOT NULL,
            status TEXT NOT NULL
                CHECK (status IN ('Quero ler', 'Lendo', 'Concluído'))
        )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela de livros:', err.message);
        } else {
            console.log('Tabela de livros pronta!');
        }
    });
});

export default db;
