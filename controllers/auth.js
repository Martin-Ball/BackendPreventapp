const { response, json } = require("express");
const bcryptjs = require('bcryptjs');
const { generarJWT } = require("../helpers/generar-jwt");
const { Usuario, Grupo, Permiso, GrupoPermiso, UsuarioGrupo, UsuarioPermiso } = require('../models/security-module');

const login = async(req, res = response) => {

    const { username, password } = req.body

    try {

        const user = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!user) {
            return res.status(400).json({
                msg: 'Usuario/Password no son correctos - nombre_usuario'
            });
        }

        // Verificar si el usuario está activo
        if (user.estado == 0) {
            return res.status(400).json({
                msg: 'Usuario/Password no son correctos - estado false'
            });
        }

        // Verificar la contraseña comparando la ingresada con la del usuario
        const validPassword = bcryptjs.compareSync(password, user.contrasena);
        if (!validPassword) {
            return res.status(400).json({
                msg: 'Usuario/Password no son correctos - password'
            });
        }

        const userGroup = await UsuarioGrupo.findOne({
            where: { idUsuario: user.idUsuario },
        });
        
        console.log(`UsuarioGrupo: ${userGroup.idGrupo }, ${user.idUsuario}`)


        if (userGroup == null) {
            return res.status(400).json({
                msg: 'Usuario no tiene entradas en UsuarioGrupo',
            });
        }

        const permissions = await Permiso.findAll({
            attributes: ['idPermiso', 'nombrePermiso'],
            include: [
                {
                    model: Grupo,
                    through: {
                        model: GrupoPermiso,
                        where: { idGrupo: userGroup.idGrupo },
                    },
                    attributes: [],
                },
            ],
        });

        // Generar el JWT
        const token = await generarJWT(user.idUsuario);

        res.json({
            user,
            permissions,
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

const register = async (req, res = response) => {
    try {
        const { username, password, type } = req.body;

        const usuario = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (usuario !== null) {
            return res.status(400).json({
                msg: 'Usuario ya registrado',
            });
        }

        const group = await Grupo.findOne({
            where: {
                nombreGrupo: type,
            },
        });

        if (!group) {
            return res.status(400).json({
                msg: 'Grupo no encontrado',
            });
        }

        const salt = bcryptjs.genSaltSync();
        const passwordEncrypt = bcryptjs.hashSync(password, salt);

        const newUser = await Usuario.create({
            nombreUsuario: username,
            contrasena: passwordEncrypt,
            estado: 1,
            GrupoId: group.idGrupo,
        });

        const token = await generarJWT(newUser.idUsuario);

        const permissionsForGroup = await Permiso.findAll({
            attributes: ['idPermiso', 'nombrePermiso'],
            include: [
                {
                    model: Grupo,
                    through: {
                        model: GrupoPermiso,
                        where: { idGrupo: group.idGrupo },
                    },
                    attributes: [],
                },
            ],
        });

        const userPermissions = permissionsForGroup.map((permiso) => ({
            idUsuario: newUser.idUsuario,
            idPermiso: permiso.idPermiso,
        }));

        await UsuarioPermiso.bulkCreate(userPermissions);

        res.json({
            newUser,
            permissionsForGroup,
            token,
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        return res.status(500).json({
            msg: error,
        });
    }
};

module.exports = {
    login,
    renewToken,
    register
};