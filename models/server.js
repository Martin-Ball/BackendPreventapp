const express = require('express')
var cors = require('cors')
const { dbConnection } = require('../database/config')
require('dotenv').config()

class Server {

    constructor() {
        this.app = express()
        this.port = process.env.PORT

        this.paths = {
            auth:       '/api/auth',
            users:      '/api/users'
        }

        //Conectar a base de datos
        this.connectDb()

        //Middlewares
        this.middlewares()

        //Rutas de mi aplicación
        this.routes()
    }

    async connectDb(){
        await dbConnection()
    }

    middlewares(){
        //CORS
        this.app.use( cors() )

        //Lectura y parse del body
        this.app.use( express.json() )

        //Directorio publico
        this.app.use( express.static('public') )

    }

    routes(){
        this.app.use( this.paths.auth, require('../routes/auth') )
        this.app.use( this.paths.users, require('../routes/users') )
    }

    listen(){
        this.app.listen( this.port, () => {
            console.log(`Server is up and running at port ${this.port}`)
        })
    }
}

module.exports = Server;