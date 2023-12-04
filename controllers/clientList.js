const { response, json } = require("express");
const { Cliente, ClienteUsuario } = require('../models/tables-db');
const { Usuario } = require('../models/security-module');
const { db } = require('../database/connection')
const { Sequelize} = require('sequelize');

const newClientList = async (req, res = response) => {
    const { usuario, clientes } = req.body;

    try {

        let adminUser = await Usuario.findOne({
            where: { nombreUsuario: usuario }
        });

        const usersByAdmin = await db.query(`
            SELECT u.idUsuario
            FROM Usuario u
            JOIN UsuarioAdmin ua ON u.idUsuario = ua.idUsuario
            JOIN UsuarioGrupo ug ON u.idUsuario = ug.idUsuario
            WHERE ua.idAdmin = :idAdmin
        `, {
            replacements: { idAdmin: adminUser.idUsuario,  },
            type: Sequelize.QueryTypes.SELECT,
        });

        usersByAdmin.push({idUsuario: adminUser.idUsuario})

        if (!usersByAdmin) {
            return res.status(400).json({
                msg: `No tiene preventistas o repartidores asociados a su usuario`
            });
        }

        for (const client of clientes) {
            const { nombre, direccion, horarioEntrega } = client;

            const newClient = await Cliente.create({
                nombre: nombre,
                direccion: direccion,
                horarioEntrega: horarioEntrega
            });

            for (user of usersByAdmin){
                existingAmount = await ClienteUsuario.create({
                    idUsuario: user.idUsuario,
                    idCliente: newClient.idCliente
                });
            }
        
        }

        res.json({
            msg: 'Lista de clientes agregados correctamente'
        });
    } catch (error) {
        console.error('Error al crear la lista de precios:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};

const getListClients = async (req, res = response) => {
    const { username } = req.query;

    try {
        const user = await Usuario.findOne({
            where: { nombreUsuario: username }
        });

        if (!user) {
            return res.status(400).json({
                msg: `No se encontró el usuario con nombre ${username}`
            });
        }

        const usersClients = await ClienteUsuario.findAll({
            where: { idUsuario: user.idUsuario }
        });

        if (!usersClients || usersClients.length === 0) {
            return res.status(400).json({
                msg: `El usuario ${username} no tiene clientes asociados`
            });
        }

        const clientList = [];
        for (const client of usersClients) {
            const clientFound = await Cliente.findOne({
                where: { idCliente: client.idCliente }
            });

            if (clientFound) {
                clientList.push({
                    idCliente: clientFound.idCliente,
                    nombre: clientFound.nombre,
                    direccion: clientFound.direccion,
                    horarioEntrega: clientFound.horarioEntrega
                });
            }
        }

        res.json({
            nombreUsuario: user.nombreUsuario,
            clientes: clientList
        });

    } catch (error) {
        console.error('Error al obtener la lista de clientes:', error);
        res.status(500).json({
            msg: 'Error interno del servidor'
        });
    }
};

module.exports = {
    newClientList,
    getListClients
};