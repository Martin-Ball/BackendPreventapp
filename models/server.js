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
            users:      '/api/users',
            list:       '/api/pricesList',
            clients:    '/api/clientsList',
            orders:     '/api/orders',
            recommended:'/api/recommended',
            backup:     '/api/backup',
            audit:      '/api/audit'   
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
        this.app.use( this.paths.list, require('../routes/pricesList') )
        this.app.use( this.paths.clients, require('../routes/clientList') )
        this.app.use( this.paths.orders, require('../routes/orders') )
        this.app.use( this.paths.recommended, require('../routes/recommended') )
        this.app.use( this.paths.backup, require('../routes/backup') )
        this.app.use( this.paths.audit, require('../routes/audit') )
    }

    listen(){
        this.app.listen( this.port, () => {
            console.log(`Server is up and running at port ${this.port}`)
        })
    }
}

module.exports = Server;