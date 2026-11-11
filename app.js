
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

// Lê os dados enviados pelo cliente em formato JSON
function getRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';

        request.on('data', (chunk) => {
            body += chunk;
        });

        request.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });

        request.on('error', reject);
    });
}

// Consulta todos os livros
function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Consulta um livro
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Executa comandos de inserção, alteração e exclusão
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// Envia uma resposta em JSON
function sendJSON(response, statusCode, data) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8'
    });

    response.end(JSON.stringify(data));
}

// Valida os dados do livro
function validateBook(book) {
    if (!book || typeof book !== 'object' || Array.isArray(book)) {
        return 'Os dados enviados são inválidos.';
    }

    const {
        titulo,
        autor,
        isbn,
        ano_publicacao,
        genero,
        status
    } = book;

    if (
        typeof titulo !== 'string' || !titulo.trim() ||
        typeof autor !== 'string' || !autor.trim() ||
        typeof genero !== 'string' || !genero.trim()
    ) {
        return 'Título, autor e gênero são obrigatórios.';
    }

    if (
        ano_publicacao === undefined ||
        !Number.isInteger(Number(ano_publicacao)) ||
        Number(ano_publicacao) < 1 ||
        Number(ano_publicacao) > new Date().getFullYear()
    ) {
        return 'O ano de publicação é inválido.';
    }

    const statusPermitidos = ['Quero ler', 'Lendo', 'Concluído'];

    if (!statusPermitidos.includes(status)) {
        return 'O status informado é inválido.';
    }

    if (isbn !== undefined && isbn !== null && typeof isbn !== 'string') {
        return 'O ISBN deve ser um texto.';
    }

    return null;
}

// Servidor HTTP
const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    try {
        // GET /api/livros - lista todos os livros
        if (pathname === '/api/livros' && request.method === 'GET') {
            const livros = await dbAll('SELECT * FROM livros');
            return sendJSON(response, 200, livros);
        }

        // POST /api/livros - cadastra um livro
        if (pathname === '/api/livros' && request.method === 'POST') {
            const livro = await getRequestBody(request);
            const erro = validateBook(livro);

            if (erro) {
                return sendJSON(response, 400, { erro });
            }

            const {
                titulo,
                autor,
                isbn,
                ano_publicacao,
                genero,
                status
            } = livro;

            await dbRun(
                `INSERT INTO livros
                (titulo, autor, isbn, ano_publicacao, genero, status)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    titulo.trim(),
                    autor.trim(),
                    isbn?.trim() || null,
                    Number(ano_publicacao),
                    genero.trim(),
                    status
                ]
            );

            return sendJSON(response, 201, {
                mensagem: 'Livro cadastrado com sucesso!'
            });
        }

        // GET /api/livros/:id - consulta um livro pelo ID
        const rotaLivro = pathname.match(/^\/api\/livros\/(\d+)$/);

        if (rotaLivro && request.method === 'GET') {
            const id = Number(rotaLivro[1]);
            const livro = await dbGet(
                'SELECT * FROM livros WHERE id = ?',
                [id]
            );

            if (!livro) {
                return sendJSON(response, 404, {
                    erro: 'Livro não encontrado.'
                });
            }

            return sendJSON(response, 200, livro);
        }

        // PUT /api/livros/:id - atualiza um livro
        if (rotaLivro && request.method === 'PUT') {
            const id = Number(rotaLivro[1]);
            const livro = await getRequestBody(request);
            const erro = validateBook(livro);

            if (erro) {
                return sendJSON(response, 400, { erro });
            }

            const {
                titulo,
                autor,
                isbn,
                ano_publicacao,
                genero,
                status
            } = livro;

            const resultado = await dbRun(
                `UPDATE livros
                SET titulo = ?, autor = ?, isbn = ?,
                    ano_publicacao = ?, genero = ?, status = ?
                WHERE id = ?`,
                [
                    titulo.trim(),
                    autor.trim(),
                    isbn?.trim() || null,
                    Number(ano_publicacao),
                    genero.trim(),
                    status,
                    id
                ]
            );

            if (resultado.changes === 0) {
                return sendJSON(response, 404, {
                    erro: 'Livro não encontrado.'
                });
            }

            return sendJSON(response, 200, {
                mensagem: 'Livro atualizado com sucesso!'
            });
        }

        // DELETE /api/livros/:id - exclui um livro
        if (rotaLivro && request.method === 'DELETE') {
            const id = Number(rotaLivro[1]);

            const resultado = await dbRun(
                'DELETE FROM livros WHERE id = ?',
                [id]
            );

            if (resultado.changes === 0) {
                return sendJSON(response, 404, {
                    erro: 'Livro não encontrado.'
                });
            }

            return sendJSON(response, 200, {
                mensagem: 'Livro excluído com sucesso!'
            });
        }

        // Rotas da API não encontradas
        if (pathname.startsWith('/api/')) {
            return sendJSON(response, 404, {
                erro: 'Rota da API não encontrada.'
            });
        }

        // Disponibiliza os arquivos HTML, CSS e JavaScript
        const arquivo = pathname === '/'
            ? 'index.html'
            : pathname.slice(1);

        const caminhoArquivo = path.resolve(publicDir, arquivo);

        if (!caminhoArquivo.startsWith(publicDir + path.sep)) {
            response.writeHead(403);
            return response.end('Acesso não permitido.');
        }

        fs.readFile(caminhoArquivo, (err, conteudo) => {
            if (err) {
                response.writeHead(404, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });
                return response.end('Arquivo não encontrado.');
            }

            const extensao = path.extname(caminhoArquivo);

            const tipos = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json'
            };

            response.writeHead(200, {
                'Content-Type': (tipos[extensao] || 'application/octet-stream') + '; charset=utf-8'
            });

            response.end(conteudo);
        });

    } catch (error) {
        console.error('Erro no servidor:', error.message);

        if (error.code === 'SQLITE_CONSTRAINT') {
            return sendJSON(response, 409, {
                erro: 'Este ISBN já está cadastrado.'
            });
        }

        if (error instanceof SyntaxError) {
            return sendJSON(response, 400, {
                erro: 'O JSON enviado é inválido.'
            });
        }

        return sendJSON(response, 500, {
            erro: 'Erro interno do servidor.'
        });
    }
});

// Inicia o servidor
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Servidor funcionando em http://localhost:${PORT}`);
});
