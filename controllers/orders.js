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
            estado: "Nuevo"
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


module.exports = {
    newOrder
};