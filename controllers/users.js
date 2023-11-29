const { response, json } = require("express");
const { Usuario, Grupo, Permiso, GrupoPermiso, UsuarioGrupo, UsuarioPermiso, UsuarioAdmin } = require('../models/security-module');
const jwt = require('jsonwebtoken')
const { db } = require('../database/connection')
const { Sequelize} = require('sequelize');

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

       
        const usersDetails = await db.query(`
            SELECT Usuario.idUsuario, Usuario.nombreUsuario, Usuario.contrasena, Usuario.estado, Grupo.nombreGrupo
            FROM UsuarioAdmin
            JOIN Usuario ON UsuarioAdmin.idUsuario = Usuario.idUsuario
            JOIN UsuarioGrupo ON Usuario.idUsuario = UsuarioGrupo.idUsuario
            JOIN Grupo ON UsuarioGrupo.idGrupo = Grupo.idGrupo
            WHERE UsuarioAdmin.idAdmin = :idAdmin
        `, {
            replacements: { idAdmin: admin.idUsuario },
            type: Sequelize.QueryTypes.SELECT,
        });

        for (const user of usersDetails) {
            const userPermissions = await db.query(`
                SELECT Permiso.nombrePermiso
                FROM UsuarioPermiso
                JOIN Permiso ON UsuarioPermiso.idPermiso = Permiso.idPermiso
                WHERE UsuarioPermiso.idUsuario = :idUsuario
            `, {
                replacements: { idUsuario: user.idUsuario },
                type: Sequelize.QueryTypes.SELECT,
            });

            user.permisos = userPermissions.map(permiso => permiso.nombrePermiso);
        }

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