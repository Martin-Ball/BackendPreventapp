const { response, json } = require("express");
const { Cliente, LineaPedido, Producto, Pedido } = require('../models/tables-db');
const jwt = require('jsonwebtoken')
const { db } = require('../database/connection')
const { Sequelize} = require('sequelize');
const bcryptjs = require('bcryptjs');
const { Usuario } = require("../models/security-module");
const moment = require('moment');

const newOrder = async (req, res = response) => {
    const { cliente, usuario, nota, productos } = req.body;

    const user = await Usuario.findOne({
        where: { nombreUsuario: usuario }
    });
    
    const client = await Cliente.findOne({
        where: { nombre: cliente }
    });

    if (!client) {
        return res.status(400).json({
            msg: `No existe el cliente`
        });
    }

    try {
        const createdOrder = await Pedido.create({
            idCliente: client.idCliente,
            nota: nota, 
            preventista_email: user.nombreUsuario,
            estado: "Nuevo",
            fecha: moment().toDate()
        });

        for(const product of productos){
            const productFound = await Producto.findOne({
                where: { nombre: product.nombreProducto }
            });

            const orderLine = await LineaPedido.create({
                idPedido: createdOrder.idPedido,
                idProducto: productFound.idProducto,
                precio: product.precio,
                cantidad: product.cantidad,
                fecha: moment().toDate()
            });
        }    

        res.json({
            msg: 'Pedido creado correctamente'
        });
    } catch (error) {
        console.error('Error al crear la lista de precios:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};

const getNewOrders = async (req, res = response) => {
    const { usuario, isAdmin } = req.query;

    try {
        let newOrders
        if(isAdmin !== 'true'){
            userAdmin = await db.query(`
                SELECT ua.idAdmin, uAdmin.nombreUsuario as adminUsername
                FROM Usuario u
                JOIN UsuarioAdmin ua ON u.idUsuario = ua.idUsuario
                JOIN Usuario uAdmin ON ua.idAdmin = uAdmin.idUsuario
                WHERE u.nombreUsuario = :username ; 
            `, {
                replacements: { username: usuario },
                type: Sequelize.QueryTypes.SELECT,
            });
        
            newOrders = await db.query(`
                SELECT p.idPedido, p.preventista_email, p.nota, p.fecha, p.estado,
                    c.nombre AS nombreCliente, c.idCliente, c.direccion, c.horarioEntrega
                FROM Pedido p
                JOIN Cliente c ON p.idCliente = c.idCliente
                WHERE p.preventista_email IN (
                    SELECT u.nombreUsuario
                    FROM Usuario u
                    JOIN UsuarioAdmin ua ON u.idUsuario = ua.idUsuario
                    WHERE ua.idAdmin = (
                        SELECT idUsuario
                        FROM Usuario
                        WHERE nombreUsuario = :usernameAdmin
                    )
                    AND u.idUsuario IN (
                        SELECT idUsuario
                        FROM UsuarioGrupo
                        WHERE idGrupo = (
                            SELECT idGrupo
                            FROM Grupo
                            WHERE nombreGrupo = 'Preventista'
                        )
                    )
                )
                AND p.estado = 'Enviado';
            `, {
                replacements: { usernameAdmin: userAdmin[0].adminUsername },
                type: Sequelize.QueryTypes.SELECT,});
        }else{
            newOrders = await db.query(`
                SELECT p.idPedido, p.preventista_email, p.nota, p.fecha, p.estado,
                    c.nombre AS nombreCliente, c.idCliente, c.direccion, c.horarioEntrega
                FROM Pedido p
                JOIN Cliente c ON p.idCliente = c.idCliente
                WHERE p.preventista_email IN (
                    SELECT u.nombreUsuario
                    FROM Usuario u
                    JOIN UsuarioAdmin ua ON u.idUsuario = ua.idUsuario
                    WHERE ua.idAdmin = (
                        SELECT idUsuario
                        FROM Usuario
                        WHERE nombreUsuario = :usernameAdmin
                    )
                    AND u.idUsuario IN (
                        SELECT idUsuario
                        FROM UsuarioGrupo
                        WHERE idGrupo = (
                            SELECT idGrupo
                            FROM Grupo
                            WHERE nombreGrupo = 'Preventista'
                        )
                    )
                )
                AND p.estado = 'Nuevo';
            `, {
                replacements: { usernameAdmin: usuario },
                type: Sequelize.QueryTypes.SELECT,
            });
        }

        const ordersWithDetails = [];

        for (const order of newOrders) {
            const orderProducts = await db.query(`
                SELECT lp.*, pr.*
                FROM LineaPedido lp
                JOIN Producto pr ON lp.idProducto = pr.idProducto
                WHERE lp.idPedido = :idPedido;
            `, {
                replacements: { idPedido: order.idPedido },
                type: Sequelize.QueryTypes.SELECT,
            });

            const orderDetails = {
                idPedido: order.idPedido,
                fecha: order.fecha,
                estado: order.estado,
                cliente: {
                    idCliente: order.idCliente,
                    nombre: order.nombreCliente,
                    direccion: order.direccion,
                    horarioEntrega: order.horarioEntrega,
                },
                preventista: order.preventista_email,
                nota: order.nota,
                productos: orderProducts.map(product => ({
                    nombreProducto: product.nombre,
                    marca: product.marca,
                    presentacion: product.presentacion,
                    cantidad_unidad: product.cantidad_unidad,
                    cantidad: product.cantidad,
                    precio: product.precio,
                })),
            };

            ordersWithDetails.push(orderDetails);
        }

        res.json(ordersWithDetails);
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

const getOrdersByDate = async (req, res = response) => {
    const { usuario, fecha, isSeller } = req.query;

    try {
        let ordersByDate
        if(isSeller !== 'true'){
            ordersByDate = await db.query(`
                SELECT p.idPedido, p.preventista_email, p.nota, p.fecha, p.estado,
                    c.nombre AS nombreCliente, c.idCliente, c.direccion, c.horarioEntrega
                FROM Pedido p
                JOIN Cliente c ON p.idCliente = c.idCliente
                WHERE p.preventista_email IN (
                    SELECT u.nombreUsuario
                    FROM Usuario u
                    JOIN UsuarioAdmin ua ON u.idUsuario = ua.idUsuario
                    WHERE ua.idAdmin = (
                        SELECT idUsuario
                        FROM Usuario
                        WHERE nombreUsuario = :usernameAdmin
                    )
                    AND u.idUsuario IN (
                        SELECT idUsuario
                        FROM UsuarioGrupo
                        WHERE idGrupo = (
                            SELECT idGrupo
                            FROM Grupo
                            WHERE nombreGrupo = 'Preventista'
                        )
                    )
                )
                AND p.fecha = :fecha;
            `, {
                replacements: { usernameAdmin: usuario, fecha: fecha },
                type: Sequelize.QueryTypes.SELECT,
            });
        }else{
            ordersByDate = await db.query(`
                SELECT p.idPedido, p.preventista_email, p.nota, p.fecha, p.estado,
                    c.nombre AS nombreCliente, c.idCliente, c.direccion, c.horarioEntrega
                FROM Pedido p
                JOIN Cliente c ON p.idCliente = c.idCliente
                WHERE p.preventista_email IN (
                    SELECT u.nombreUsuario
                    FROM Usuario u
                    WHERE nombreUsuario = :usernameSeller
                    AND u.idUsuario IN (
                        SELECT idUsuario
                        FROM UsuarioGrupo
                        WHERE idGrupo = (
                            SELECT idGrupo
                            FROM Grupo
                            WHERE nombreGrupo = 'Preventista'
                        )
                    )
                )
                AND p.fecha = :fecha;
            `, {
                replacements: { usernameSeller: usuario, fecha: fecha },
                type: Sequelize.QueryTypes.SELECT,
            });
        }

        const ordersWithDetails = [];

        for (const order of ordersByDate) {
            const orderProducts = await db.query(`
                SELECT lp.*, pr.*
                FROM LineaPedido lp
                JOIN Producto pr ON lp.idProducto = pr.idProducto
                WHERE lp.idPedido = :idPedido;
            `, {
                replacements: { idPedido: order.idPedido },
                type: Sequelize.QueryTypes.SELECT,
            });

            const orderDetails = {
                idPedido: order.idPedido,
                fecha: order.fecha,
                estado: order.estado,
                cliente: {
                    idCliente: order.idCliente,
                    nombre: order.nombreCliente,
                    direccion: order.direccion,
                    horarioEntrega: order.horarioEntrega,
                },
                preventista: order.preventista_email,
                nota: order.nota,
                productos: orderProducts.map(product => ({
                    nombreProducto: product.nombre,
                    marca: product.marca,
                    presentacion: product.presentacion,
                    cantidad_unidad: product.cantidad_unidad,
                    cantidad: product.cantidad,
                    precio: product.precio,
                })),
            };

            ordersWithDetails.push(orderDetails);
        }

        res.json(ordersWithDetails);
    } catch (error) {
        console.error('Error al obtener los pedidos por fecha:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

const sendOrderToDelivery = async (req, res = response) => {
    const { idOrder } = req.query;

    try {
        const updateState = await db.query(`
            update Pedido set estado = 'Enviado' where idPedido = :id
        `, {
            replacements: { id: idOrder },
            type: Sequelize.QueryTypes.UPDATE,
        });

        res.json('Pedido enviado!');
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

const cancelOrder = async (req, res = response) => {
    const { idOrder } = req.query;

    try {
        const updateState = await db.query(`
            update Pedido set estado = 'Cancelado' where idPedido = :id
        `, {
            replacements: { id: idOrder },
            type: Sequelize.QueryTypes.UPDATE,
        });

        res.json('Pedido cancelado');
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

const orderDelivered = async (req, res = response) => {
    const { idOrder } = req.query;

    try {
        const updateState = await db.query(`
            update Pedido set estado = 'Entregado' where idPedido = :id
        `, {
            replacements: { id: idOrder },
            type: Sequelize.QueryTypes.UPDATE,
        });

        res.json('Pedido entregado!');
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

const notDeliverOrder = async (req, res = response) => {
    const { idOrder } = req.query;

    try {
        const updateState = await db.query(`
            update Pedido set estado = 'No entregado' where idPedido = :id
        `, {
            replacements: { id: idOrder },
            type: Sequelize.QueryTypes.UPDATE,
        });

        res.json('Pedido no enviado');
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

module.exports = {
    newOrder,
    getNewOrders,
    sendOrderToDelivery,
    cancelOrder,
    getOrdersByDate,
    notDeliverOrder,
    orderDelivered
};