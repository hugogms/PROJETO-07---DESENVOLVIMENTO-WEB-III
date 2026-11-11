
const formLivro = document.getElementById('formLivro');
const listaLivros = document.getElementById('listaLivros');
const mensagem = document.getElementById('mensagem');

const pesquisaLivros = document.getElementById('pesquisaLivros');
const pesquisaApi = document.getElementById('pesquisaApi');
const resultadosApi = document.getElementById('resultadosApi');

const livroId = document.getElementById('livroId');
const titulo = document.getElementById('titulo');
const autor = document.getElementById('autor');
const isbn = document.getElementById('isbn');
const anoPublicacao = document.getElementById('ano_publicacao');
const genero = document.getElementById('genero');
const status = document.getElementById('status');

const tituloFormulario = document.getElementById('tituloFormulario');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

// Exibe mensagens de sucesso ou erro
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = tipo === 'erro'
        ? 'mensagem-erro'
        : 'mensagem-sucesso';
}

// Faz requisições para a API do servidor
async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || 'Ocorreu um erro na requisição.');
    }

    return dados;
}

// Carrega e exibe os livros cadastrados
async function carregarLivros() {
    try {
        const livros = await requisicao('/api/livros');
        const busca = pesquisaLivros.value.toLowerCase();

        const livrosFiltrados = livros.filter((livro) =>
            livro.titulo.toLowerCase().includes(busca)
        );

        listaLivros.innerHTML = '';

        if (livrosFiltrados.length === 0) {
            listaLivros.textContent = 'Nenhum livro encontrado.';
            listaLivros.className = 'mensagem-vazia';
            return;
        }

        listaLivros.className = '';

        livrosFiltrados.forEach((livro) => {
            const card = document.createElement('div');
            card.className = 'livro';

            const nome = document.createElement('h3');
            nome.textContent = livro.titulo;

            const autorLivro = document.createElement('p');
            autorLivro.textContent = `Autor: ${livro.autor}`;

            const anoLivro = document.createElement('p');
            anoLivro.textContent = `Ano: ${livro.ano_publicacao}`;

            const generoLivro = document.createElement('p');
            generoLivro.textContent = `Gênero: ${livro.genero}`;

            const isbnLivro = document.createElement('p');
            isbnLivro.textContent = `ISBN: ${livro.isbn || 'Não informado'}`;

            const statusLivro = document.createElement('span');
            statusLivro.textContent = livro.status;
            statusLivro.className = 'status';

            if (livro.status === 'Quero ler') {
                statusLivro.classList.add('status-quero-ler');
            } else if (livro.status === 'Lendo') {
                statusLivro.classList.add('status-lendo');
            } else {
                statusLivro.classList.add('status-concluido');
            }

            const acoes = document.createElement('div');
            acoes.className = 'acoes-livro';

            const botaoEditar = document.createElement('button');
            botaoEditar.textContent = 'Editar';
            botaoEditar.className = 'btn-editar';
            botaoEditar.addEventListener('click', () => editarLivro(livro));

            const botaoExcluir = document.createElement('button');
            botaoExcluir.textContent = 'Excluir';
            botaoExcluir.className = 'btn-excluir';
            botaoExcluir.addEventListener('click', () => excluirLivro(livro.id));

            acoes.append(botaoEditar, botaoExcluir);

            card.append(
                nome,
                autorLivro,
                anoLivro,
                generoLivro,
                isbnLivro,
                statusLivro,
                acoes
            );

            listaLivros.appendChild(card);
        });

    } catch (erro) {
        mostrarMensagem(erro.message, 'erro');
    }
}

// Cadastra ou atualiza um livro
formLivro.addEventListener('submit', async (event) => {
    event.preventDefault();

    const livro = {
        titulo: titulo.value,
        autor: autor.value,
        isbn: isbn.value,
        ano_publicacao: Number(anoPublicacao.value),
        genero: genero.value,
        status: status.value
    };

    const id = livroId.value;

    try {
        if (id) {
            await requisicao(`/api/livros/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(livro)
            });

            mostrarMensagem('Livro atualizado com sucesso!', 'sucesso');

        } else {
            await requisicao('/api/livros', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(livro)
            });

            mostrarMensagem('Livro cadastrado com sucesso!', 'sucesso');
        }

        limparFormulario();
        carregarLivros();

    } catch (erro) {
        mostrarMensagem(erro.message, 'erro');
    }
});

// Preenche o formulário para editar um livro
function editarLivro(livro) {
    livroId.value = livro.id;
    titulo.value = livro.titulo;
    autor.value = livro.autor;
    isbn.value = livro.isbn || '';
    anoPublicacao.value = livro.ano_publicacao;
    genero.value = livro.genero;
    status.value = livro.status;

    tituloFormulario.textContent = 'Atualizar livro';
    btnSalvar.textContent = 'Salvar alterações';
    btnCancelar.hidden = false;

    formLivro.scrollIntoView({ behavior: 'smooth' });
}

// Exclui um livro após confirmação
async function excluirLivro(id) {
    const confirmar = confirm('Tem certeza de que deseja excluir este livro?');

    if (!confirmar) {
        return;
    }

    try {
        await requisicao(`/api/livros/${id}`, {
            method: 'DELETE'
        });

        mostrarMensagem('Livro excluído com sucesso!', 'sucesso');
        carregarLivros();

    } catch (erro) {
        mostrarMensagem(erro.message, 'erro');
    }
}

// Limpa o formulário e retorna ao cadastro
function limparFormulario() {
    formLivro.reset();
    livroId.value = '';

    tituloFormulario.textContent = 'Cadastrar livro';
    btnSalvar.textContent = 'Cadastrar livro';
    btnCancelar.hidden = true;
}

// Cancela a edição
btnCancelar.addEventListener('click', limparFormulario);

// Pesquisa na biblioteca cadastrada
pesquisaLivros.addEventListener('input', carregarLivros);

// Pesquisa livros na Open Library
document.getElementById('btnPesquisarApi').addEventListener('click', pesquisarOpenLibrary);

async function pesquisarOpenLibrary() {
    const busca = pesquisaApi.value.trim();

    resultadosApi.innerHTML = '';

    if (!busca) {
        resultadosApi.textContent = 'Digite o título de um livro para pesquisar.';
        return;
    }

    resultadosApi.textContent = 'Pesquisando...';

    try {
        const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(busca)}&limit=5`;

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error('Não foi possível consultar a Open Library.');
        }

        const dados = await resposta.json();

        resultadosApi.innerHTML = '';

        if (!dados.docs || dados.docs.length === 0) {
            resultadosApi.textContent = 'Nenhum livro encontrado. Você pode preencher o formulário manualmente.';
            return;
        }

        dados.docs.forEach((livro) => {
            const resultado = document.createElement('div');
            resultado.className = 'resultado-api';

            if (livro.cover_i) {
                const capa = document.createElement('img');
                capa.src = `https://covers.openlibrary.org/b/id/${livro.cover_i}-M.jpg`;
                capa.alt = `Capa de ${livro.title}`;
                resultado.appendChild(capa);
            }

            const informacoes = document.createElement('div');

            const nome = document.createElement('h3');
            nome.textContent = livro.title || 'Título não informado';

            const nomeAutor = document.createElement('p');
            nomeAutor.textContent = `Autor: ${livro.author_name?.[0] || 'Não informado'}`;

            const ano = document.createElement('p');
            ano.textContent = `Ano: ${livro.first_publish_year || 'Não informado'}`;

            const botao = document.createElement('button');
            botao.textContent = 'Usar este livro';

            botao.addEventListener('click', () => {
                titulo.value = livro.title || '';
                autor.value = livro.author_name?.[0] || '';
                isbn.value = livro.isbn?.[0] || '';

                const anoEncontrado = livro.first_publish_year;

                anoPublicacao.value =
                    anoEncontrado &&
                    anoEncontrado <= new Date().getFullYear()
                        ? anoEncontrado
                        : '';

                genero.value = livro.subject?.[0] || '';
                status.value = 'Quero ler';

                tituloFormulario.textContent = 'Cadastrar livro';
                btnSalvar.textContent = 'Cadastrar livro';
                livroId.value = '';
                btnCancelar.hidden = true;

                mostrarMensagem(
                    'Dados preenchidos. Confira as informações antes de cadastrar.',
                    'sucesso'
                );

                formLivro.scrollIntoView({ behavior: 'smooth' });
            });

            informacoes.append(nome, nomeAutor, ano, botao);
            resultado.appendChild(informacoes);
            resultadosApi.appendChild(resultado);
        });

    } catch (erro) {
        resultadosApi.textContent =
            'Não foi possível acessar a Open Library. Você pode cadastrar o livro manualmente.';
    }
}

// Carrega os livros quando a página é aberta
carregarLivros();
    