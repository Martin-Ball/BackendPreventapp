const { response, json } = require("express");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
const { generarJWT } = require("../helpers/generar-jwt");
const { Usuario, Grupo, Permiso, GrupoPermiso, UsuarioGrupo, UsuarioPermiso , UsuarioAdmin } = require('../models/security-module');

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

        const groupType = await Grupo.findOne({
            where: { idGrupo: userGroup.idGrupo },
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
            groupType,
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
    const token = req.header('x-token')
  
    try {
      const esTokenValido = await validarToken(token);

      console.log(esTokenValido)
  
      if (!esTokenValido) {
        return res.json({
          valid: false,
        });
      }
      
      console.log(`uid de x-token: ${req.uid}`)
      const newToken = await generarJWT(req.uid);
  
      res.json({
        valid: true,
        token: newToken,
      });
    } catch (error) {
      console.error('Error al renovar el token:', error);
      return res.status(500).json({
        msg: 'Error al renovar el token',
      });
    }
};

const validarToken = async (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.SECRETORPRIVATEKEY, (err, decoded) => {
        if (err) {
          console.log(`error: ${err}`)
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
};

const register = async (req, res = response) => {
    try {
        const { username, password, type, usernameAdmin } = req.body;

        const usuario = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (usuario !== null) {
            return res.status(400).send({
                msg: 'Usuario ya registrado',
            });
        }

        const group = await Grupo.findOne({
            where: {
                nombreGrupo: type,
            },
        });

        if (!group) {
            return res.status(400).send({
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

        await UsuarioGrupo.create({
            idUsuario: newUser.idUsuario,
            idGrupo: group.idGrupo,
          });
        
        if(usernameAdmin != ""){
            const {idUsuario} = await Usuario.findOne({ where: { nombreUsuario: usernameAdmin } });

            await UsuarioAdmin.create({
                idUsuario: newUser.idUsuario,
                idAdmin: idUsuario,
            });
        }

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

        const token = await generarJWT(newUser.idUsuario);

        res.json({
            newUser,
            group,
            permissionsForGroup,
            token,
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        return res.status(500).send({
            msg: error,
        });
    }
};

module.exports = {
    login,
    renewToken,
    register
};