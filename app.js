require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cookieparser = require("cookie-parser");
const Mustache = require("mustache");

const app = express();

app.use(express.static(path.join(__dirname, "public"))); 
app.use("/styles", express.static(path.join(__dirname, "styles")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieparser());

app.use((req, res, next) => {
  const metodo = String(req.body?._method || "").toUpperCase();

  if (req.method === "POST" && ["PUT", "DELETE"].includes(metodo)) {
    req.method = metodo;
  }

  next();
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
});


function mostrar(nome, dados = {}) {
  const arquivo = path.join(__dirname, "paginas", `${nome}.html`);
  return Mustache.render(fs.readFileSync(arquivo, "utf-8"), dados);
}

function criptografar(texto) {
  const cifra = crypto.createCipheriv(
    "aes-256-cbc",
    process.env.CRIPTO_CHAVE,
    process.env.CRIPTO_IV,
  );

  return cifra.update(texto, "utf-8", "hex") + cifra.final("hex");
}

function descriptografar(texto) {
  try {
    const decifra = crypto.createDecipheriv(
      "aes-256-cbc",
      process.env.CRIPTO_CHAVE,
      process.env.CRIPTO_IV,
    );

    return decifra.update(texto, "hex", "utf-8") + decifra.final("utf-8");
  } catch (erro) {
    return texto;
  }
}

async function excluir(res, tabela, colunaId, id, volta, motivo) {
  try {
    await db.query(`DELETE FROM ${tabela} WHERE ${colunaId} = ?`, [id]);
    res.redirect(volta);
  } catch (erro) {
    if (erro.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(409)
        .send(
          `<p>Não foi possível excluir: ${motivo}</p><p><a href="${volta}">Voltar</a></p>`,
        );
    }

    console.error(erro);

    res
      .status(500)
      .send(`<p>Erro ao excluir.</p><p><a href="${volta}">Voltar</a></p>`);
  }
}

async function mostrarPlanos(req, res, erro = "") {
  const [planos] = await db.query(
    "SELECT plano_tratamento.*, paciente.nome AS paciente_nome FROM plano_tratamento JOIN paciente ON paciente.id_paciente = plano_tratamento.paciente_id",
  );

  const [listaPacientes] = await db.query("SELECT id_paciente, nome FROM paciente");

  const editar = planos.find((p) => String(p.id_plano) === req.query.editar);

  const pacientes = listaPacientes.map((paciente) => ({
    ...paciente,
    selecionado: editar && paciente.id_paciente === editar.paciente_id ? "selected" : "",
  }));

  res.send(
    mostrar("planos", {
      planos,
      pacientes,
      erro,
      editando: Boolean(editar),
      acao: editar ? `/planos/${editar.id_plano}` : "/planos",
      form: editar || {},
    }),
  );
}

app.get("/", (req, res) => res.send(mostrar("login")));

app.post("/login", async (req, res) => {
  const { email, senha } = req.body || {};

  if (!email || !senha) {
    return res
      .status(401)
      .send(mostrar("login", { erro: "E-mail ou senha inválidos." }));
  }

  try {
    const [usuarios] = await db.query(
      "SELECT * FROM usuario WHERE email = ?",
      [email],
    );

    const usuario = usuarios[0];

    if (
      !usuario ||
      !usuario.senha_hash ||
      !(await bcrypt.compare(senha, usuario.senha_hash))
    ) {
      return res
        .status(401)
        .send(mostrar("login", { erro: "E-mail ou senha inválidos." }));
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, nome: usuario.nome },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("token", token, { httpOnly: true });
    res.redirect("/principal");
  } catch (erro) {
    console.error(erro);

    res.status(500).send(mostrar("login", { erro: "Erro ao realizar login." }));
  }
});

app.post("/sair", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.use((req, res, next) => {
  try {
    req.usuario = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    next();
  } catch (erro) {
    res.redirect("/");
  }
});

app.get("/principal", (req, res) =>
  res.send(mostrar("principal", { nome: req.usuario.nome })),
);

// =================================== PACIENTES =================================== //

app.get("/pacientes", async (req, res) => {
  const busca = req.query.busca || "";

  const [lista] = await db.query("SELECT * FROM paciente WHERE nome LIKE ?", [
    `%${busca}%`,
  ]);

  const pacientes = lista.map((paciente) => ({
    ...paciente,
    cpf_criptografado: descriptografar(paciente.cpf_criptografado),
  }));

  const editar = pacientes.find(
    (paciente) => String(paciente.id_paciente) === req.query.editar,
  );

  res.send(
    mostrar("pacientes", {
      busca,
      pacientes,
      editando: Boolean(editar),
      acao: editar ? `/pacientes/${editar.id_paciente}` : "/pacientes",
      form: editar || {},
    }),
  );
});

app.post("/pacientes", async (req, res) => {
  const { nome, cpf_criptografado, telefone, email, data_nascimento } = req.body;

  await db.query(
    "INSERT INTO paciente (nome, cpf_criptografado, telefone, email, data_nascimento) VALUES (?, ?, ?, ?, ?)",
    [nome, criptografar(cpf_criptografado), telefone, email, data_nascimento || null],
  );

  res.redirect("/pacientes");
});

app.put("/pacientes/:id", async (req, res) => {
  const { nome, cpf_criptografado, telefone, email, data_nascimento } = req.body;

  await db.query(
    "UPDATE paciente SET nome = ?, cpf_criptografado = ?, telefone = ?, email = ?, data_nascimento = ? WHERE id_paciente = ?",
    [
      nome,
      criptografar(cpf_criptografado),
      telefone,
      email,
      data_nascimento || null,
      req.params.id,
    ],
  );

  res.redirect("/pacientes");
});

app.delete("/pacientes/:id", async (req, res) => {
  await excluir(
    res,
    "paciente",
    "id_paciente",
    req.params.id,
    "/pacientes",
    "O paciente já possui planos de tratamento cadastrados.",
  );
});

// =================================== PLANOS DE TRATAMENTO =================================== //

app.get("/planos", (req, res) => mostrarPlanos(req, res));

app.post("/planos", async (req, res) => {
  const { paciente_id, descricao, data_inicio, data_fim, status } = req.body;

  if (!paciente_id) {
    return mostrarPlanos(req, res, "Paciente é obrigatório.");
  }

  await db.query(
    "INSERT INTO plano_tratamento (paciente_id, descricao, data_inicio, data_fim, status) VALUES (?, ?, ?, ?, ?)",
    [paciente_id, descricao, data_inicio, data_fim || null, status || "Ativo"],
  );

  res.redirect("/planos");
});

app.put("/planos/:id", async (req, res) => {
  const { paciente_id, descricao, data_inicio, data_fim, status } = req.body;

  if (!paciente_id) {
    return mostrarPlanos(req, res, "Paciente é obrigatório.");
  }

  await db.query(
    "UPDATE plano_tratamento SET paciente_id = ?, descricao = ?, data_inicio = ?, data_fim = ?, status = ? WHERE id_plano = ?",
    [paciente_id, descricao, data_inicio, data_fim || null, status || "Ativo", req.params.id],
  );

  res.redirect("/planos");
});

app.delete("/planos/:id", async (req, res) => {
  await excluir(
    res,
    "plano_tratamento",
    "id_plano",
    req.params.id,
    "/planos",
    "O plano de tratamento possui sessões agendadas.",
  );
});

// =================================== SESSÕES =================================== //

app.get("/sessoes", async (req, res) => {
  const [lista] = await db.query(
    "SELECT sessao.*, plano_tratamento.descricao AS plano_descricao, plano_tratamento.data_inicio AS plano_data_inicio, plano_tratamento.data_fim AS plano_data_fim, plano_tratamento.status AS plano_status, paciente.nome AS paciente_nome, paciente.cpf_criptografado AS paciente_cpf, paciente.telefone AS paciente_telefone, paciente.email AS paciente_email, paciente.data_nascimento AS paciente_data_nascimento FROM sessao JOIN plano_tratamento ON plano_tratamento.id_plano = sessao.plano_id JOIN paciente ON paciente.id_paciente = plano_tratamento.paciente_id ORDER BY sessao.data_sessao ASC",
  );

  const [planos] = await db.query(
    "SELECT plano_tratamento.id_plano, plano_tratamento.descricao, paciente.nome AS paciente_nome FROM plano_tratamento JOIN paciente ON paciente.id_paciente = plano_tratamento.paciente_id",
  );

  const sessoes = lista.map((s) => ({
    ...s,
    paciente_cpf: descriptografar(s.paciente_cpf),
    data_br: new Date(`${s.data_sessao}T${s.horario}`).toLocaleString("pt-BR"),
    data_input: `${s.data_sessao}T${s.horario.slice(0, 5)}`,
  }));

  res.send(mostrar("sessoes", { sessoes, planos }));
});

app.post("/sessoes", async (req, res) => {
  const { plano_id, data_sessao, horario, status, observacoes } = req.body;

  const dataFormatada = data_sessao.includes("T") ? data_sessao.split("T")[0] : data_sessao;
  const horaFormatada = horario || (data_sessao.includes("T") ? data_sessao.split("T")[1] : "00:00:00");

  await db.query(
    "INSERT INTO sessao (plano_id, data_sessao, horario, status, observacoes) VALUES (?, ?, ?, ?, ?)",
    [plano_id, dataFormatada, horaFormatada, status || "Agendada", observacoes],
  );

  res.redirect("/sessoes");
});

app.put("/sessoes/:id", async (req, res) => {
  const { data_sessao, horario, status } = req.body;

  const dataFormatada = data_sessao.includes("T") ? data_sessao.split("T")[0] : data_sessao;
  const horaFormatada = horario || (data_sessao.includes("T") ? data_sessao.split("T")[1] : "00:00:00");

  await db.query(
    "UPDATE sessao SET data_sessao = ?, horario = ?, status = COALESCE(?, status) WHERE id_sessao = ?",
    [dataFormatada, horaFormatada, status || null, req.params.id],
  );

  res.redirect("/sessoes");
});

app.delete("/sessoes/:id", async (req, res) => {
  await excluir(res, "sessao", "id_sessao", req.params.id, "/sessoes", " ");
});

// =================================== SERVIDOR =================================== //

const porta = process.env.PORT || 3003;

app.listen(porta, () =>
  console.log(`Clínica de Fisioterapia rodando em http://localhost:${porta}`),
);