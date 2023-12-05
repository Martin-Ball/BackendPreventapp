const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { newClientList, getListClients } = require('../controllers/clientList')

const router = Router()

router.post('/newList', [
    validarJWT,
    validarCampos
], newClientList)  

router.get('/getList', [
    validarJWT,
    validarCampos
], getListClients)  

module.exports = router