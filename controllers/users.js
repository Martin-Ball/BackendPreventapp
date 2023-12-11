const { response, json } = require("express");
const { Usuario, Grupo, Permiso, GrupoPermiso, UsuarioGrupo, UsuarioPermiso, UsuarioAdmin } = require('../models/security-module');
const jwt = require('jsonwebtoken')
const { db } = require('../database/connection')
const { Sequelize} = require('sequelize');
const bcryptjs = require('bcryptjs');

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
        const { username } = req.query;

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
            WHERE UsuarioAdmin.idAdmin = :idAdmin AND Usuario.estado = 1
        `, {
            replacements: { idAdmin: admin.idUsuario },
            type: Sequelize.QueryTypes.SELECT,
        });

        for (const user of usersDetails) {
            const userPermissions = await db.query(`
                SELECT Permiso.nombrePermiso, UsuarioPermiso.estado
                FROM UsuarioPermiso
                JOIN Permiso ON UsuarioPermiso.idPermiso = Permiso.idPermiso
                WHERE UsuarioPermiso.idUsuario = :idUsuario
            `, {
                replacements: { idUsuario: user.idUsuario, estado: user.estado },
                type: Sequelize.QueryTypes.SELECT,
            });

            user.permisos = userPermissions.map(permiso => ({
                nombrePermiso: permiso.nombrePermiso,
                estado: permiso.estado
            }));
        }

        res.json({
            usuarios: usersDetails,
        });
    } catch (error) {
        console.error('Error al obtener usuarios para el administrador:', error);
        return res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

const updatePermissionsState = async (req, res) => {
    const {username, permissions} = req.body

    const user = await Usuario.findOne({
        where: { nombreUsuario: username }
    });

    if (!user) {
        return res.status(404).json({
            msg: `Usuario ${username} no encontrado`
        });
    }

    try {
        for (const updatePermission of permissions) {
            const { nombrePermiso, estado } = updatePermission;

            const permission = await Permiso.findOne({
                where: { nombrePermiso: nombrePermiso }
            });

            if (!permission) {
                return res.status(404).json({
                    msg: `Permiso ${nombrePermiso} no encontrado`
                });
            }

            const updatedPermissions = await db.query(`
                UPDATE UsuarioPermiso
                SET estado = :estado
                WHERE idUsuario = :idUsuario AND idPermiso = 2;
            `, {
                replacements: { idUsuario: user.idUsuario, estado: estado, idPermiso: permission.idPermiso },
                type: Sequelize.QueryTypes.UPDATE,
            });
        

            console.log('ID del usuario:', user.idUsuario);
            console.log('ID del permiso:', permission.idPermiso);
            console.log('ID del permiso:', estado);
        }

        res.json({
            msg: 'Estados de permisos actualizados correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar los estados de permisos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};

const updatePasswordAndGroup = async (req, res) => {
    const { username, newPassword, newGroupName } = req.body;
    try {
        const user = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!user) {
            return res.status(404).json({
                msg: `Usuario ${username} no encontrado`
            });
        }

        let passwordEncrypt = ''

        if(newPassword !== ''){
            const lastPassword = user.contrasena;

            const salt = bcryptjs.genSaltSync();
            passwordEncrypt = bcryptjs.hashSync(newPassword, salt);
    
            const userGroupCurrent = await UsuarioGrupo.findOne({ where: { idUsuario: user.idUsuario } });
            const userGroup = await Grupo.findOne({ where: { idGrupo: userGroupCurrent.idGrupo } });
    
            if (!userGroup) {
                return res.status(401).json({
                    msg: 'Grupo de usuario no encontrado',
                });
            }

            await Usuario.update(
                { contrasena: passwordEncrypt },
                { where: { nombreUsuario: username } }
            );
        }
        

        if (newGroupName != '') {
            const newGroup = await Grupo.findOne({ where: { nombreGrupo: newGroupName } });

            if (!newGroup) {
                return res.status(401).json({
                    msg: `Grupo ${newGroup} no encontrado`,
                });
            }

            const updateGroup = await db.query(`
                UPDATE UsuarioGrupo
                SET idGrupo = :idNewGroup
                WHERE idUsuario = :idUsuario;
            `, {
                replacements: { idUsuario: user.idUsuario, idNewGroup: newGroup.idGrupo },
                type: Sequelize.QueryTypes.UPDATE,
            });

            const newGroupPermissions = await GrupoPermiso.findAll({ where: { idGrupo: newGroup.idGrupo } });

            await UsuarioPermiso.destroy({ where: { idUsuario: user.idUsuario } });

            const newPermissions = newGroupPermissions.map((permiso) => ({
                idUsuario: user.idUsuario,
                idPermiso: permiso.idPermiso,
            }));

            await UsuarioPermiso.bulkCreate(newPermissions);
        }

        console.log('Contraseña y grupo actualizados correctamente');
        res.json({
            msg: 'Contraseña y grupo actualizados'
        });
    } catch (error) {
        console.error('Error al actualizar la contraseña y grupo:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};

const deleteUser = async (req, res) => {
    const {username} = req.body

    const user = await Usuario.findOne({
        where: { nombreUsuario: username }
    });

    if (!user) {
        return res.status(404).json({
            msg: `Usuario ${username} no encontrado`
        });
    }

    try {
        const changeUserState = await db.query(`
            UPDATE Usuario
            SET estado = 0
            WHERE idUsuario = :idUsuario
        `, {
            replacements: { idUsuario: user.idUsuario },
            type: Sequelize.QueryTypes.UPDATE,
        });

        res.json({
            msg: 'Estados de permisos actualizados correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar los estados de permisos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};

const getUserInfo = async (req, res) => {
    const { nombreUsuario } = req.query;

    try {
        const userInfo = await db.query(`
            SELECT u.idUsuario, u.nombreUsuario, ug.idGrupo, g.nombreGrupo
            FROM Usuario u
            JOIN UsuarioGrupo ug ON u.idUsuario = ug.idUsuario
            JOIN Grupo g ON ug.idGrupo = g.idGrupo
            WHERE u.nombreUsuario = :nombreUsuario;
        `, {
            replacements: { nombreUsuario: nombreUsuario },
            type: Sequelize.QueryTypes.SELECT,
        });

        res.json(userInfo[0]);
    } catch (error) {
        console.error('Error al obtener la información del usuario:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

module.exports = {
    getPermissionsByUser,
    getUsers,
    updatePermissionsState,
    updatePasswordAndGroup,
    deleteUser,
    getUserInfo
};