import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import knex from '../conexao';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const senhaJwt: Secret = process.env.JWT_SECRET_KEY!;

type tipoRespostaPromise = Promise<Response<any, Record<string, any>>>;

const cadastrarUsuario = async (req: Request, res: Response): tipoRespostaPromise => {
    try {
        const { nome, email, senha }: { nome: string, email: string, senha: string } = req.body
        const senhaHash: string = await bcrypt.hash(senha.toString(), 10);
        const insert = await knex('usuarios').insert({ nome, email, senha: senhaHash }).returning(['id', 'nome', 'email']);
        return res.status(201).json(insert[0]);
    } catch (error: any) {
        return res.status(500).json({ mensagem: "Erro interno do servidor" });
    }
};

const login = async (req: Request, res: Response): tipoRespostaPromise => {
    const { email, senha }: { email: string, senha: string } = req.body
    try {
        const usuario = await knex('usuarios').where({ email: email })
        const token = jwt.sign({ usuario: usuario[0].id }, senhaJwt, { expiresIn: "6h" })
        const { senha: _, ...usuarioLogado } = usuario[0]
        return res.status(200).json({
            usuario: usuarioLogado,
            token
        })
    } catch (err: any) {
        return res.status(500).json({ mensagem: `erro interno do servidor ${err.message}` })
    }
};
const inspecionarUsuario = async (req: Request, res: Response): tipoRespostaPromise => {
    const token: string = req.headers.authorization?.split(" ")[1] as string
    const { usuario } = jwt.decode(token) as JwtPayload

    try {

        let usuarioRetornado = await knex('usuarios').where({ id: usuario })
        const { senha: _, ...usuarioSemSenha } = usuarioRetornado[0]

        return res.status(200).json(usuarioSemSenha)

    } catch (error) {
        return res.status(200).json({ mensagem: "Erro interno de servidor" })
    }
};

const editarUsuario = async (req: Request, res: Response): tipoRespostaPromise => {
    const token: string = req.headers.authorization?.split(" ")[1] as string
    const { usuario } = jwt.decode(token) as JwtPayload
    try {
        const { nome, email, senha }: { nome: string, email: string, senha: string } = req.body
        const senhaHash: string = await bcrypt.hash(senha.toString(), 10)
        await knex('usuarios').update({ nome, email, senha: senhaHash }).where({ id: usuario })
        return res.status(200).json({ mensagem: "usuario atualizado" })
    } catch (error: any) {
        return res.status(500).json({ mensagem: "Erro interno de servidor2" })
    }
};

const listarCategorias = async (req: Request, res: Response): tipoRespostaPromise => {
    try {
        const consulta = await knex('categorias');
        return res.status(200).json(consulta)
    } catch (error: any) {
        return res.status(500).json({ mensagem: "Erro interno de servidor" })
    }
};

export {
    cadastrarUsuario,
    login,
    inspecionarUsuario,
    editarUsuario,
    listarCategorias
}