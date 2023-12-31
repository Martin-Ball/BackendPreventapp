const { response, request } = require('express')
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models/security-module');


const validarJWT = async(req = request, res = response, next) => {

    const token = req.header('x-token');

    if(!token){
        return res.status(401).json({
            msg: 'No hay token en la peticion'
        })
    }

    try {
        //verifica el jwt
        const { uid } = jwt.verify( token, process.env.SECRETORPRIVATEKEY)
        const usuario = await Usuario.findOne({ where: { idUsuario: uid } });
        console.log(usuario)

        if(!usuario){
            return res.status(401).json({
                msg:'Token no valido - usuario no existente'
            })
        }

        //Verificar si el uid tiene estado en true
        if(usuario.estado == 0){
            return res.status(401).json({
                msg:'Token no valido - usuario con estado: false'
            })
        }

        req.uid = uid
        req.usuario = usuario

        next()

    } catch (error) {
        console.log(error)   
        res.status(401).json({
            msg: 'Token no valido'
        })     
    }
}

module.exports = {
    validarJWT
}