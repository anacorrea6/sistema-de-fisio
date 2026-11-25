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
('Administrador', 'admin@fisio.com', '$2b$10$Qnc130VcJQeUyiTbt8X.COi5s4RzWzAIzuA8rryFimTQmYaHo.0zq'),
('Ana Silva', 'ana@fisio.com', '$2b$10$Qnc130VcJQeUyiTbt8X.COi5s4RzWzAIzuA8rryFimTQmYaHo.0zq'),
('Carlos Souza', 'carlos@fisio.com', '$2b$10$Qnc130VcJQeUyiTbt8X.COi5s4RzWzAIzuA8rryFimTQmYaHo.0zq');

INSERT INTO paciente
(nome, cpf_criptografado, telefone, email, data_nascimento)
VALUES
('João Pedro', 'e8cc94869024db841a036ca469d8026e:11ec6abd6acaa9f727ba9ade20de0d34', '11987654321',
 'joao@email.com', '1990-05-15'),

('Maria Oliveira', 'b907b91d08e0fa8b4c493c3a1d477e65:e0daecefd25a70cdffb6cf6633726a7b', '11976543210',
 'maria@email.com', '1985-08-20'),

('Lucas Santos', 'cd300fdbb27e58018aaf7588ac9c199e:d948e3457f54c3f530cf45dda5858d44', '11965432109',
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
