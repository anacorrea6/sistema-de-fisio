CREATE DATABASE IF NOT EXISTS fisio_db;

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
('Administrador', 'admin@fisio.com', '$2b$10$Q0hNKBXuIQraITVKqK4v9eE4ybILL8uY2ckzp3/OX2KBtltIncTua'),
('Ana Silva', 'ana@fisio.com', '$2b$10$Q0hNKBXuIQraITVKqK4v9eE4ybILL8uY2ckzp3/OX2KBtltIncTua'),
('Carlos Souza', 'carlos@fisio.com', '$2b$10$Q0hNKBXuIQraITVKqK4v9eE4ybILL8uY2ckzp3/OX2KBtltIncTua');

INSERT INTO paciente
(nome, cpf_criptografado, telefone, email, data_nascimento)
VALUES
('João Pedro', 'a70fa7435496108f26336fd9a249250f:3f637754a10a48f314cb5754b58a26ed', '11987654321',
 'joao@email.com', '1990-05-15'),

('Maria Oliveira', '796f00c3a7f3f256483c289bb6e35268:75d6c5fd5f7f5e91f89dcc14a3226923', '11976543210',
 'maria@email.com', '1985-08-20'),

('Lucas Santos', '5c18ca9906cd5a93555e2c713e7df00a:17b86d4f1ba5b6ce9efb4d3784b59234', '11965432109',
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
