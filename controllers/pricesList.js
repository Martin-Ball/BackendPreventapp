const { response, json } = require("express");
const { ListaDePrecios, Producto_ListaDePrecio, Producto, Cantidad, Preventista_ListaDePrecio, AuditoriaListaDePrecios } = require('../models/tables-db');
const jwt = require('jsonwebtoken')
const { db } = require('../database/connection')
const { Sequelize} = require('sequelize');
const bcryptjs = require('bcryptjs');
const { Usuario } = require("../models/security-module");
const moment = require('moment');

const newList = async (req, res = response) => {
    const { nombreLista, usuario, productos, fechaVigencia } = req.body;

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
            fechaVigencia: moment(fechaVigencia, 'DD/MM/YYYY').format('YYYY-MM-DD')
        });

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
        }    

        const existingResellerListPrice = await db.query(`
            select distinct idLista from Preventista_ListaDePrecio where email = :emailPreventista
        `, {
            replacements: { emailPreventista: resellersByAdmin[0].nombreUsuario,  },
            type: Sequelize.QueryTypes.SELECT,
        });
        
        for (reseller of resellersByAdmin){
            if(existingResellerListPrice){
                const deleteResellerListPrice = await db.query(`
                    delete from Preventista_ListaDePrecio where email = :emailPreventista
                `, {
                    replacements: { emailPreventista: reseller.nombreUsuario,  },
                    type: Sequelize.QueryTypes.DELETE,
                });
            }

            existingAmount = await Preventista_ListaDePrecio.create({
                idLista: createdList.idLista,
                email: reseller.nombreUsuario,
                email_administrador: adminUser.nombreUsuario
            });
        }

        if(existingResellerListPrice.length !== 0){
            const productsByListId = await db.query(`
                select distinct idProducto from Producto_ListaDePrecio where idLista = :id
            `, {
                replacements: { id: existingResellerListPrice[0].idLista,  },
                type: Sequelize.QueryTypes.SELECT,
            });     

            for (productToDelete of productsByListId){
                const deleteProductsByList = await db.query(`
                    delete from Producto_ListaDePrecio where idProducto = :id
                `, {
                    replacements: { id: productToDelete.idProducto,  },
                    type: Sequelize.QueryTypes.DELETE,
                }); 

                const deleteProductsByListId = await db.query(`
                    delete from Producto where idProducto = :id
                `, {
                    replacements: { id: productToDelete.idProducto,  },
                    type: Sequelize.QueryTypes.DELETE,
                }); 
            }
        }

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

        const insert = await AuditoriaListaDePrecios.create({
            idLista: createdList.idLista,
            idUsuario: adminUser.idUsuario,
            nombre: createdList.nombre,
            fechaVigencia: createdList.fechaVigencia,
            fechaCreacion: Sequelize.literal('GETDATE()'),
        });

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

const getListPrices = async (req, res = response) => {
    const { username } = req.query;

    try {
        const idListResult = await db.query(`
        SELECT DISTINCT
            plp.idLista,
            lp.nombre,
            lp.fechaVigencia
        FROM Preventista_ListaDePrecio plp
        JOIN ListaDePrecios lp ON plp.idLista = lp.idLista
        WHERE plp.email = :nombreUsuario OR plp.email_administrador = :nombreUsuario;
        `, {
            replacements: { nombreUsuario: username },
            type: Sequelize.QueryTypes.SELECT,
        });

        if (!idListResult || idListResult.length === 0) {
            return res.status(404).json({
                msg: 'No se encontró ninguna lista asociada al usuario proporcionado.',
            });
        }

        const idList = idListResult[0].idLista;
        const productList = await db.query(`
            SELECT DISTINCT
                plp2.idProducto,
                pr.nombre,
                pr.marca,
                pr.presentacion,
                pr.cantidad_unidad,
                plp2.precioUnitario
            FROM Preventista_ListaDePrecio plp
            JOIN Producto_ListaDePrecio plp2 ON plp.idLista = plp2.idLista
            JOIN Producto pr ON plp2.idProducto = pr.idProducto
            WHERE plp2.idLista = :idLista;
        `, {
            replacements: { idLista: idList },
            type: Sequelize.QueryTypes.SELECT,
        });

        const lists = {
            idLista: idListResult[0].idLista,
            nombre: idListResult[0].nombre,
            fechaVigencia: idListResult[0].fechaVigencia,
            productos: productList.map(item => ({
                nombreProducto: item.nombre,
                marca: item.marca,
                presentacion: item.presentacion,
                cantidad_unidad: item.cantidad_unidad,
                precio: item.precioUnitario,
            })),
        };

        res.status(200).json(lists);
    } catch (error) {
        console.error('Error al obtener la lista de precios:', error);
        res.status(500).json({
            msg: 'Error interno del servidor',
        });
    }
};

module.exports = {
    newList,
    getListPrices
};