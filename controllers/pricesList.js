const { response, json } = require("express");
const { ListaDePrecios, Producto_ListaDePrecio, Producto, Cantidad, Preventista_ListaDePrecio } = require('../models/tables-db');
const jwt = require('jsonwebtoken')
const { db } = require('../database/connection')
const { Sequelize} = require('sequelize');
const bcryptjs = require('bcryptjs');
const { Usuario } = require("../models/security-module");

const newList = async (req, res = response) => {
    const { nombreLista, usuario, productos } = req.body;

    const existingList = await ListaDePrecios.findOne({
        where: { nombre: nombreLista }
    });

    if (existingList) {
        return res.status(400).json({
            msg: `La lista de precios con nombre ${existingList.nombre} ya existe`
        });
    }

    try {
        const createdList = await ListaDePrecios.create({
            nombre: nombreLista,
        });

        for (const producto of productos) {
            const { nombreProducto, precio } = producto;

            let existingProduct = await Producto.findOne({
                where: { nombre: nombreProducto }
            });

            let existingAmount = await Cantidad.findOne({
                where: { unidad: producto.cantidad_unidad }
            });

            if (!existingAmount){
                existingAmount = await Cantidad.create({
                    unidad: producto.cantidad_unidad,
                });
            }

            if (!existingProduct) {
                existingProduct = await Producto.create({
                    nombre: producto.nombreProducto,
                    marca: producto.marca,
                    presentacion: producto.presentacion,
                    cantidad_unidad: existingAmount.unidad
                });

                const productList = await Producto_ListaDePrecio.create({
                    idLista: createdList.idLista,
                    idProducto: existingProduct.idProducto,
                    precioUnitario: producto.precio
                });
            }
        }

        let adminUser = await Usuario.findOne({
            where: { nombreUsuario: usuario }
        });

        const resellersByAdmin = await db.query(`
            SELECT u.nombreUsuario
            FROM Usuario u
            JOIN UsuarioAdmin ua ON u.idUsuario = ua.idUsuario
            JOIN UsuarioGrupo ug ON u.idUsuario = ug.idUsuario
            WHERE ua.idAdmin = :idAdmin AND ug.idGrupo = 3
        `, {
            replacements: { idAdmin: adminUser.idUsuario,  },
            type: Sequelize.QueryTypes.SELECT,
        });

        if (!resellersByAdmin) {
            return res.status(400).json({
                msg: `No tiene preventistas asociados a su usuario`
            });
        }else{            
            for (reseller of resellersByAdmin){
                existingAmount = await Preventista_ListaDePrecio.create({
                    idLista: createdList.idLista,
                    email: reseller.nombreUsuario
                });
            }
        }

        res.json({
            msg: 'Lista de precios y productos agregados correctamente'
        });
    } catch (error) {
        console.error('Error al crear la lista de precios:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};

module.exports = {
    newList
};