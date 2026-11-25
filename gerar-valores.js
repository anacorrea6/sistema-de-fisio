require('dotenv').config()
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

function gerarHashSenha(senha) {
    return bcrypt.hashSync(senha, 10)
}

function criptografarCPF(cpf) {
    const cifra = crypto.createCipheriv(
        'aes-256-cbc',
        process.env.CRIPTO_CHAVE,
        process.env.CRIPT_IV
    )
    return cifra.update(cpf, 'utf8', 'hex') + cifra.final('hex')
}

// Usuários
console.log('Usuario 1 (123456):', gerarHashSenha('123456'))

console.log('CPF 11122233344 criptografado:', criptografarCPF('11122233344'))

// Usuário 2
console.log('Hash senha 654321:', gerarHashSenha('654321'))
console.log('CPF 22233344455 criptografado:', criptografarCPF('22233344455'))

// Usuário 3
console.log('Hash senha 123123:', gerarHashSenha('123123'))
console.log('CPF 33344455566 criptografado:', criptografarCPF('33344455566'))


/*
Usuario 1 (123456): '$2b$10$4q7e1AfpztrUndaA.S9cDeIRIWJnziADJyK8fbujFTXr/hS4fbwfy'

CPF 11122233344 criptografado: b9332f3140efaf757e4d684975ef3365

Hash senha 654321: $2b$10$6.Kx95bRbsLdpqF.VhJHDugCjn9d5lQm9jHYYrQsjMISR3ZuNY/Ze

CPF 22233344455 criptografado: be4f639df4cd927594a5e3084b540dc1

Hash senha 123123: $2b$10$KSgFqWUBPDI22Qma319JmObLXthFW4GVaUEUDBs7jsWX6dO8gikLa

CPF 33344455566 criptografado: 65eea67226931d6bc95e431330183923
 */