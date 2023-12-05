const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { newOrder } = require('../controllers/orders')

const router = Router()

router.post('/newOrder', [
    validarJWT,
    validarCampos
], newOrder)  

module.exports = router