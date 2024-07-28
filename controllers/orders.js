const { response, json } = require("express");
const { Cliente, LineaPedido, Producto, Pedido, AuditoriaCambioEstadoPedido } = require('../models/tables-db');
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
            fecha: moment().local('es-AR').toDate()
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
                fecha: moment().local('es-AR').toDate()
            });  
        }    

        const insert = await AuditoriaCambioEstadoPedido.create({
            idUsuario: user.idUsuario,
            idPedido: createdOrder.idPedido,
            fechaCreacion: Sequelize.literal('NOW()'),
            estado: createdOrder.estado
        });

        res.json({
            msg: 'Pedido creado correctamente'
        });
    } catch (error) {
        console.error('Error al crear el pedido:', error);
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
                    c.nombre AS nombreCliente, c.idCliente, c.direccion, c.horarioEntrega, c.lat, c.long
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
                    c.nombre AS nombreCliente, c.idCliente, c.direccion, c.horarioEntrega, c.lat, c.long
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
                    lat: order.lat,
                    long: order.long
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
    const { usuario, fecha, groupType } = req.query;

    try {
        let ordersByDate
        if(groupType == 1){ //Admin
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
        }else if(groupType == 2){ //Delivery
            userAdmin = await db.query(`
                SELECT ua.idAdmin, uAdmin.nombreUsuario
                FROM UsuarioAdmin ua
                JOIN Usuario u ON ua.idUsuario = u.idUsuario
                JOIN Usuario uAdmin ON ua.idAdmin = uAdmin.idUsuario
                WHERE u.nombreUsuario = :usuario;
                `, {
                replacements: { usuario: usuario, fecha: fecha },
                type: Sequelize.QueryTypes.SELECT,
            });

            const userAdminName = userAdmin[0].nombreUsuario

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
                        WHERE nombreUsuario = :userAdmin
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
                AND p.fecha = :fecha
                AND p.estado IN ('Entregado', 'No entregado', 'Enviado');
            `, {
                replacements: { userAdmin: userAdminName, fecha: fecha },
                type: Sequelize.QueryTypes.SELECT,
            });
        }else{ //Seller
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
                fecha: moment(order.fecha).add(1, 'days').format('YYYY-MM-DD'),
                estado: order.estado,
                cliente: {
                    idCliente: order.idCliente,
                    nombre: order.nombreCliente,
                    direccion: order.direccion,
                    horarioEntrega: order.horarioEntrega,
                    lat: order.lat,
                    long: order.long
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
    const { idOrder, username } = req.query;

    try {
        const updateState = await db.query(`
            update Pedido set estado = 'Enviado' where idPedido = :id
        `, {
            replacements: { id: idOrder },
            type: Sequelize.QueryTypes.UPDATE,
        });

        const userId = await Usuario.findOne({ where: { nombreUsuario: username } });

        const insert = await AuditoriaCambioEstadoPedido.create({
            idUsuario: userId.idUsuario,
            idPedido: +idOrder,
            fechaCreacion: Sequelize.literal('NOW()'),
            estado: 'Enviado'
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
    const { idOrder, username } = req.query;

    try {
        const updateState = await db.query(`
            update Pedido set estado = 'Cancelado' where idPedido = :id
        `, {
            replacements: { id: idOrder },
            type: Sequelize.QueryTypes.UPDATE,
        });

        const userId = await Usuario.findOne({ where: { nombreUsuario: username } });

        const insert = await AuditoriaCambioEstadoPedido.create({
            idUsuario: userId.idUsuario,
            idPedido: +idOrder,
            fechaCreacion: Sequelize.literal('NOW()'),
            estado: 'Cancelado'
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
    const { idOrder, username } = req.query;

    try {
        const updateState = await db.query(`
            update Pedido set estado = 'Entregado' where idPedido = :id
        `, {
            replacements: { id: idOrder },
            type: Sequelize.QueryTypes.UPDATE,
        });

        const userId = await Usuario.findOne({ where: { nombreUsuario: username } });

        const insert = await AuditoriaCambioEstadoPedido.create({
            idUsuario: userId.idUsuario,
            idPedido: +idOrder,
            fechaCreacion: Sequelize.literal('NOW()'),
            estado: 'Entregado'
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
    const { idOrder, username } = req.query;

    try {
        const updateState = await db.query(`
            update Pedido set estado = 'No entregado' where idPedido = :id
        `, {
            replacements: { id: idOrder },
            type: Sequelize.QueryTypes.UPDATE,
        });

        const userId = await Usuario.findOne({ where: { nombreUsuario: username } });

        const insert = await AuditoriaCambioEstadoPedido.create({
            idUsuario: userId.idUsuario,
            idPedido: +idOrder,
            fechaCreacion: Sequelize.literal('NOW()'),
            estado: 'No entregado'
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