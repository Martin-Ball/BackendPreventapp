const { response, json } = require("express");
const { Cliente, ClienteUsuario, AuditoriaCliente } = require('../models/tables-db');
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
            const { nombre, direccion, horarioEntrega, lat, long } = client;

        
                const newClient = await Cliente.create({
                    nombre: nombre,
                    direccion: direccion,
                    horarioEntrega: horarioEntrega,
                    lat: lat,
                    long: long
                });

                const insert = await AuditoriaCliente.create({
                    idCliente: newClient.idCliente,
                    fechaCreacion: Sequelize.literal('GETDATE()'),
                });
    
                for (user of usersByAdmin){
                    const userFound = await Usuario.findOne({
                        where: { idUsuario: user.idUsuario }
                    });

                    const client = await ClienteUsuario.create({
                        idUsuario: userFound.idUsuario,
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
                    horarioEntrega: clientFound.horarioEntrega,
                    lat: clientFound.lat,
                    long: clientFound.long
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