const { response, json } = require("express");
const bcryptjs = require('bcryptjs');
const { generarJWT } = require("../helpers/generar-jwt");
const { Usuario, Grupo } = require('../models/security-module');
const {db} = require("../database/connection")

const login = async(req, res = response) => {

    const { username, password } = req.body

    try {

        const usuario = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!usuario) {
            return res.status(400).json({
                msg: 'Usuario/Password no son correctos - nombre_usuario'
            });
        }

        // Verificar si el usuario está activo
        if (usuario.estado == 0) {
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

const renewToken = async (req, res = response) => {
    const { uid } = req;
  
    const token = await generarJWT(uid);

    res.json({
        token
    });
};

const register =  async(req, res = response) => {
    try {

        const { username, password, type } = req.body

        const usuario = await Usuario.findOne({ where: { nombreUsuario: username } });

        console.log(`usuario encontrado: ${usuario}`)

        if(usuario != null){
            return res.status(400).json({
                msg: 'Usuario ya registrado'
            });
        }

        const group = await Grupo.findOne({
            where: {
                nombreGrupo: type
            }
        });

        if (!group) {
            return res.status(400).json({
                msg: 'Grupo no encontrado'
            });
        }

        const salt = bcryptjs.genSaltSync()
        passwordEncrypt = bcryptjs.hashSync( password, salt )

        console.log(passwordEncrypt)

        const newUser = await Usuario.create({
            nombreUsuario: username,
            contrasena: passwordEncrypt,
            estado: 1,
            GrupoId: group.idGrupo
        });

        console.log('Usuario registrado:', newUser);

        // Generar el JWT
        const token = await generarJWT(newUser.idUsuario);

        res.json({
            newUser,
            token
        });

    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        return res.status(500).json({
            msg: error
        });   
    }
};

module.exports = {
    login,
    renewToken,
    register
};