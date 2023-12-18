const { response, json } = require("express");
const { Usuario } = require('../models/security-module');
const { LineaPedido, Cliente } = require('../models/tables-db');
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

const getOrdersChangeState = async(req, res = response) => {

    const { username } = req.query

    try {

        const user = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!user) {
            return res.status(400).json({
                msg: 'Usuario no encontrado'
            });
        }

        const changeStateAudit = await db.query(`
            SELECT 
                acp.fechaCreacion,
                acp.estado,
                p.fecha AS FechaPedido,
                c.nombre AS NombreCliente,
                c.direccion AS DireccionCliente
            FROM AuditoriaCambioEstadoPedido acp
            JOIN Pedido p ON acp.idPedido = p.idPedido
            JOIN Cliente c ON p.idCliente = c.idCliente
            WHERE acp.idUsuario = :idUsuario;
        `, {
            replacements: { idUsuario: user.idUsuario },
            type: Sequelize.QueryTypes.SELECT,
        });

        res.json({
            changeStateAudit
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Hable con el administrador'
        });
    }
};

const getProductPriceAudit = async(req, res = response) => {

    const { username, month, productName } = req.query

    try {

        const user = await Usuario.findOne({ where: { nombreUsuario: username } });

        if (!user) {
            return res.status(400).json({
                msg: 'Usuario no encontrado'
            });
        }

        const productsPrice = await db.query(`
            SELECT
                p.nombre AS nombreProducto,
                lp.nombre AS nombreLista,
                plpd.precioUnitario,
                lp.fechaVigencia,
                alp.fechaCreacion
            FROM
                Producto p
            INNER JOIN
                Producto_ListaDePrecio plpd ON p.idProducto = plpd.idProducto
            INNER JOIN
                ListaDePrecios lp ON plpd.idLista = lp.idLista
            INNER JOIN
                AuditoriaListaDePrecios alp ON lp.idLista = alp.idLista
            INNER JOIN
                Usuario u ON alp.idUsuario = u.idUsuario
            WHERE
                YEAR(lp.fechaVigencia) = YEAR(GETDATE())
                AND MONTH(lp.fechaVigencia) = :month
                AND lp.idLista IN (
                    SELECT DISTINCT alp.idLista
                    FROM AuditoriaListaDePrecios alp
                    INNER JOIN Usuario u ON alp.idUsuario = u.idUsuario
                    WHERE
                        YEAR(alp.fechaVigencia) = YEAR(GETDATE())
                        AND MONTH(alp.fechaVigencia) = :month
                        AND u.nombreUsuario = :nombreUsuario
                )
                AND p.nombre = :productName
            ORDER BY
                nombreProducto ASC;
        `, {
            replacements: { nombreUsuario: username, month: +month, productName: productName },
            type: Sequelize.QueryTypes.SELECT,
        });

        const groupedProducts = productsPrice.reduce((acc, product) => {
            const key = product.nombreProducto;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(product);
            return acc;
        }, {});

        // Ordenar por nombre del producto
        const sortedProducts = Object.keys(groupedProducts).map((key) => ({
            nombreProducto: key,
            data: groupedProducts[key],
        }));

        res.json({
            productsPrice: sortedProducts
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Hable con el administrador'
        });
    }
};

const getClientPurchasesAudit = async(req, res = response) => {

    const { clientName } = req.query

    try {

        const user = await Cliente.findOne({ where: { nombre: clientName } });

        if (!user) {
            return res.status(400).json({
                msg: 'Usuario no encontrado'
            });
        }

        const clientPurchases = await db.query(`
            SELECT
                p.fecha,
                p.preventista_email,
                SUM(lp.precio * lp.cantidad) AS montoTotal,
                c.nombre AS nombreCliente
            FROM
                Pedido p
            INNER JOIN
                Cliente c ON p.idCliente = c.idCliente
            INNER JOIN
                LineaPedido lp ON p.idPedido = lp.idPedido
            WHERE
                c.nombre = :clientName
            GROUP BY
                p.idPedido, p.fecha, c.nombre, p.preventista_email;
        `, {
            replacements: { clientName: clientName },
            type: Sequelize.QueryTypes.SELECT,
        });

        res.json({
            clientPurchases
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Hable con el administrador'
        });
    }
};

const getClientCreationAudit = async(req, res = response) => {

    const { clientName } = req.query

    try {

        const user = await Cliente.findOne({ where: { nombre: clientName } });

        if (!user) {
            return res.status(400).json({
                msg: 'Usuario no encontrado'
            });
        }

        const creationClient = await db.query(`
            SELECT
                c.nombre AS nombreCliente,
                ac.fechaCreacion
            FROM
                AuditoriaCliente ac
            INNER JOIN
                Cliente c ON ac.idCliente = c.idCliente
            WHERE
                c.nombre = :clientName;
        `, {
            replacements: { clientName: clientName },
            type: Sequelize.QueryTypes.SELECT,
        });

        res.json({
            creationDate: creationClient[0].fechaCreacion
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
    getRecommendedReports,
    getOrdersChangeState,
    getProductPriceAudit,
    getClientPurchasesAudit,
    getClientCreationAudit
};