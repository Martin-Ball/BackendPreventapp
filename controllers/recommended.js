const { response } = require("express");
const jwt = require('jsonwebtoken')
const { db } = require('../database/connection')
const { Sequelize} = require('sequelize');
const { AuditoriaRecomendados, Cliente } = require('../models/tables-db');
const { Usuario } = require("../models/security-module");

const getRecommendedProducts = async (req, res = response) => {
    const { client, username } = req.query;

    try {
        let productsRecommended = await db.query(`
                SELECT TOP 4
                p.nombre AS nombreProducto,
                p.marca,
                p.presentacion,
                p.cantidad_unidad,
                pl.precioUnitario as precio
            FROM
                Pedido ped
                JOIN LineaPedido lp ON ped.idPedido = lp.idPedido
                JOIN Producto p ON lp.idProducto = p.idProducto
                JOIN Cliente c ON ped.idCliente = c.idCliente
                JOIN Producto_ListaDePrecio pl ON p.idProducto = pl.idProducto
            WHERE
                c.nombre = :clientName
                AND pl.idLista = (
                    SELECT idLista
                    FROM Preventista_ListaDePrecio
                    WHERE email = :username
                )
            GROUP BY
                p.idProducto,
                p.nombre,
                p.marca,
                p.presentacion,
                p.cantidad_unidad,
                pl.precioUnitario
            ORDER BY
                COUNT(*) DESC;
        `, {
            replacements: { clientName: client, username: username },
            type: Sequelize.QueryTypes.SELECT,
        });

        const clientId = await Cliente.findOne({ where: { nombre: client } });
        const userId = await Usuario.findOne({ where: { nombreUsuario: username } });

        const insert = await AuditoriaRecomendados.create({
            idCliente: clientId.idCliente,
            idUsuario: userId.idUsuario,
            fechaCreacion: Sequelize.literal('GETDATE()'),
        });

        if (productsRecommended.length === 0) {
            return res.status(200).json({
                products: [],
                monthlyPurchases: [],
            });
        }

        let monthlyPurchases = await db.query(`
            SELECT MONTH(ped.fecha) AS mes, SUM(lp.cantidad * lp.precio) AS total
            FROM Pedido ped
            JOIN LineaPedido lp ON ped.idPedido = lp.idPedido
            JOIN Producto pr ON lp.idProducto = pr.idProducto
            JOIN Cliente c ON ped.idCliente = c.idCliente
            WHERE c.nombre = :clientName
            GROUP BY MONTH(ped.fecha)
            ORDER BY MONTH(ped.fecha);
        `, {
            replacements: { clientName: client },
            type: Sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            products: productsRecommended,
            monthlyPurchases: monthlyPurchases,
        });
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

module.exports = {
    getRecommendedProducts
};