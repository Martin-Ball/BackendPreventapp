const jwt = require('jsonwebtoken')
require('dotenv').config()

//uid = user identifier
const generarJWT = (uid = '') => {
    return new Promise((resolve, reject) => {
        
        const payload = { uid }
        jwt.sign(payload, process.env.SECRETORPRIVATEKEY, {
            //tiempo en el que expira el token
            expiresIn: '4h'
        }, (err, token) => {
            if(err){
                console.log(err)
                reject('No se pudo generar el token')
            } else{
                resolve(token)
            }
        })

    })
}

module.exports = {
    generarJWT
}