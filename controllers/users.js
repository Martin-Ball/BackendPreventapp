const { response, json } = require("express");
const { Usuario, Grupo, Permiso, GrupoPermiso, UsuarioGrupo, UsuarioPermiso, UsuarioAdmin } = require('../models/security-module');
const jwt = require('jsonwebtoken')

const getPermissionsByUser = async (req, res = response) => {
    try {
        const token = req.get('x-token');

        if (!token) {
            return res.status(401).json({
                msg: 'No hay token en la petición',
            });
        }

        // Decodificar el token sin verificar la firma
        const decodedToken = jwt.decode(token);

        if (!decodedToken || !decodedToken.uid) {
            return res.status(401).json({
                msg: 'No se pudo obtener el uid del token',
            });
        }

        const usuario = await Usuario.findOne({ where: { idUsuario: decodedToken.uid } });

        if (!usuario) {
            return res.status(401).json({
                msg: 'Usuario no encontrado',
            });
        }

        const userGroup = await UsuarioGrupo.findOne({
            where: { idUsuario: usuario.idUsuario },
        });

        if (!userGroup) {
            return res.status(401).json({
                msg: 'Grupo de usuario no encontrado',
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

        res.json({
            permissions: permissions,
        });
    } catch (error) {
        console.error('Error al obtener los permisos del usuario:', error);
        return res.status(500).json({
            msg: 'Error al obtener los permisos del usuario',
        });
    }
};

const getUsers = async (req, res) => {
    try {
        const { username } = req.body;

        // Buscar el usuario administrador por su nombre de usuario
        const admin = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!admin) {
            return res.status(404).json({
                msg: 'Administrador no encontrado',
            });
        }

        const usersIds = await UsuarioAdmin.findAll({
            where: { idAdmin: admin.idUsuario },
        });
        
        const usersDetails = await Usuario.findAll({
            where: { idUsuario: usersIds.map(user => user.idUsuario) },
            attributes: ['idUsuario', 'nombreUsuario', 'contrasena', 'estado'],
            include: [
                {
                    model: UsuarioGrupo,
                    as: 'UsuarioGrupos',
                    include: [
                        {
                            model: Grupo,
                            as: 'Grupo',
                            attributes: ['nombreGrupo'],
                        },
                    ],
                },
            
            ],
        });

        res.json({
            msg: 'Usuarios obtenidos correctamente',
            usuarios: usersDetails,
        });
    } catch (error) {
        console.error('Error al obtener usuarios para el administrador:', error);
        return res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

module.exports = {
    getPermissionsByUser,
    getUsers
};