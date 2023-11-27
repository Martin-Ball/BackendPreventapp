const { response, json } = require("express");
const bcryptjs = require('bcryptjs');
const { generarJWT } = require("../helpers/generar-jwt");
const { Usuario } = require('../models/security-module');
const {db} = require("../database/connection")

const login = async(req, res = response) => {

    const { nombre_usuario, password } = req.body

    try {

        const usuario = await Usuario.findOne({ where: { nombre_usuario } });

        if (!usuario) {
            return res.status(400).json({
                msg: 'Usuario/Password no son correctos - nombre_usuario'
            });
        }

        // Verificar si el usuario está activo
        if (usuario.estado == 1) {
            return res.status(400).json({
                msg: 'Usuario/Password no son correctos - estado false'
            });
        }

        // Verificar la contraseña comparando la ingresada con la del usuario
        const validPassword = bcryptjs.compareSync(password, usuario.contrasena);
        if (!validPassword) {
            return res.status(400).json({
                msg: 'Usuario/Password no son correctos - password'
            });
        }

        // Generar el JWT
        const token = await generarJWT(usuario.idUsuario);

        res.json({
            usuario,
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Hable con el administrador'
        });
    }
};

module.exports = {
    login
};