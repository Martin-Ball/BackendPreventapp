const { response, json } = require("express");
const { Usuario } = require('../models/security-module');
const { LineaPedido } = require('../models/tables-db');
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

const getTurnoverUser = async(req, res = response) => {

    const { username } = req.query

    try {

        const user = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!user) {
            return res.status(400).json({
                msg: 'Usuario no encontrado'
            });
        }

        const turnover = await db.query(`
            SELECT MONTH(p.fecha) AS Mes, SUM(lp.cantidad * lp.precio) AS VolumenVentas
            FROM Pedido p
            JOIN LineaPedido lp ON p.idPedido = lp.idPedido
            WHERE YEAR(p.fecha) = YEAR(GETDATE()) 
            AND p.preventista_email IN (SELECT nombreUsuario FROM Usuario WHERE idUsuario = :idUsuario)
            GROUP BY MONTH(p.fecha)
            ORDER BY Mes;
        `, {
            replacements: { idUsuario: user.idUsuario },
            type: Sequelize.QueryTypes.SELECT,
        });

        res.json({
            turnover
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Hable con el administrador'
        });
    }
};

const getRecommendedReports = async(req, res = response) => {

    const { username } = req.query

    try {

        const user = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!user) {
            return res.status(400).json({
                msg: 'Usuario no encontrado'
            });
        }

        const recommendedReports = await db.query(`
            SELECT 
                ar.fechaCreacion,
                c.nombre AS NombreCliente,
                c.direccion AS DireccionCliente
            FROM AuditoriaRecomendados ar
            JOIN Cliente c ON ar.idCliente = c.idCliente
            WHERE ar.idUsuario = :idUsuario;
        `, {
            replacements: { idUsuario: user.idUsuario },
            type: Sequelize.QueryTypes.SELECT,
        });

        res.json({
            recommendedReports
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Hable con el administrador'
        });
    }
};

module.exports = {
    getLoginUser,
    getTurnoverUser,
    getRecommendedReports
};