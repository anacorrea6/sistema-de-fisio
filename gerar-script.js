
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ======================================
// FUNÇÃO PARA CRIPTOGRAFAR CPF
// ======================================

function criptografraCpf(texto) {

    const chave = Buffer.from(process.env.CRIPTO_CHAVE, 'hex');

    if (chave.length !== 32) {
        throw new Error('A chave precisa ter 32 bytes!');
    }

    // IV aleatório para cada CPF
    const iv = crypto.randomBytes(16);

    const cifra = crypto.createCipheriv(
        'aes-256-cbc',
        chave,
        iv
    );

    const cpfCriptografado =
        cifra.update(texto, 'utf8', 'hex') +
        cifra.final('hex');

    // Salva IV junto com o CPF criptografado
    return iv.toString('hex') + ':' + cpfCriptografado;
}

// ======================================
// CRIAR HASH DAS SENHAS
// ======================================

const senhaHash = bcrypt.hashSync('1234', 10);

// ======================================
// CRIPTOGRAFAR CPFS
// ======================================

const cpf1 = criptografraCpf('13456891234');
const cpf2 = criptografraCpf('09875432789');
const cpf3 = criptografraCpf('09876890543');

// ======================================
// SCRIPT SQL
// ======================================

const sql = `CREATE DATABASE IF NOT EXISTS fisio_db;

USE fisio_db;

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL
);

CREATE TABLE paciente (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf_criptografado VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    data_nascimento DATE
);

CREATE TABLE plano_tratamento (
    id_plano INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Ativo',

    FOREIGN KEY (paciente_id)
    REFERENCES paciente(id_paciente)
);

CREATE TABLE sessao (
    id_sessao INT AUTO_INCREMENT PRIMARY KEY,
    plano_id INT NOT NULL,
    data_sessao DATE NOT NULL,
    horario TIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Agendada',
    observacoes TEXT,

    FOREIGN KEY (plano_id)
    REFERENCES plano_tratamento(id_plano)
);

INSERT INTO usuario (nome, email, senha_hash) VALUES
('Administrador', 'admin@fisio.com', '${senhaHash}'),
('Ana Silva', 'ana@fisio.com', '${senhaHash}'),
('Carlos Souza', 'carlos@fisio.com', '${senhaHash}');

INSERT INTO paciente
(nome, cpf_criptografado, telefone, email, data_nascimento)
VALUES
('João Pedro', '${cpf1}', '11987654321',
 'joao@email.com', '1990-05-15'),

('Maria Oliveira', '${cpf2}', '11976543210',
 'maria@email.com', '1985-08-20'),

('Lucas Santos', '${cpf3}', '11965432109',
 'lucas@email.com', '2000-03-10');

INSERT INTO plano_tratamento
(paciente_id, descricao, data_inicio, data_fim, status)
VALUES
(1, 'Fisioterapia para recuperação muscular',
 '2026-11-01', '2026-12-01', 'Ativo'),

(2, 'Tratamento para dores na coluna',
 '2026-11-05', '2026-12-05', 'Ativo'),

(3, 'Reabilitação após lesão no joelho',
 '2026-11-10', '2027-01-10', 'Ativo');

INSERT INTO sessao
(plano_id, data_sessao, horario, status, observacoes)
VALUES
(1, '2026-11-26', '08:00:00', 'Agendada',
 'Primeira sessão de recuperação muscular'),

(2, '2026-11-27', '09:30:00', 'Agendada',
 'Sessão para tratamento da coluna'),

(3, '2026-11-28', '10:00:00', 'Agendada',
 'Sessão de reabilitação do joelho');

SELECT
    s.id_sessao,
    s.data_sessao,
    s.horario,
    s.status,
    p.id_paciente,
    p.nome AS nome_paciente,
    pt.id_plano,
    pt.descricao AS plano_tratamento
FROM sessao s
INNER JOIN plano_tratamento pt
    ON s.plano_id = pt.id_plano
INNER JOIN paciente p
    ON pt.paciente_id = p.id_paciente
ORDER BY s.data_sessao ASC;
`;

// ======================================
// CRIAR PASTA E SALVAR ARQUIVO SQL
// ======================================

const pastaDatabase = path.join(__dirname, 'database');

if (!fs.existsSync(pastaDatabase)) {
    fs.mkdirSync(pastaDatabase, { recursive: true });
}

const caminhoSaida = path.join(pastaDatabase, 'script.sql');

fs.writeFileSync(caminhoSaida, sql, 'utf8');

console.log('Script SQL gerado com sucesso!');
console.log(`Arquivo salvo em: ${caminhoSaida}`);
