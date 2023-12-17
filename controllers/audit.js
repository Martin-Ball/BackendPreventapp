const { response, json } = require("express");
const { Usuario, Grupo, Permiso, GrupoPermiso, UsuarioGrupo, UsuarioPermiso , UsuarioAdmin } = require('../models/security-module');
const { Administrador, Repartidor, Preventista } = require('../models/tables-db');
const { db } = require('../database/connection')
const { Sequelize} = require('sequelize');

const getLoginUser = async(req, res = response) => {

    const { username } = req.query

    try {

        const user = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!user) {
            return res.status(400).json({
                msg: 'Usuario no encontrado'
            });
        }

        if (user.estado == 0) {
            return res.status(400).json({
                msg: 'Usuario deshabilitado'
            });
        }

        const logins = await db.query(`
            SELECT fechaInicioSesion 
            FROM LoginUsuarioAuditoria 
            WHERE idUsuario = :idUsuario;
        `, {
            replacements: { idUsuario: user.idUsuario },
            type: Sequelize.QueryTypes.SELECT,
        });

        res.json({
            logins
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Hable con el administrador'
        });
    }
};

module.exports = {
    getLoginUser
};