const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { newOrder, getNewOrders, sendOrderToDelivery, cancelOrder } = require('../controllers/orders')

const router = Router()

router.post('/newOrder', [
    validarJWT,
    validarCampos
], newOrder)  

router.get('/getNewOrders', [
    validarJWT,
    validarCampos
], getNewOrders)

router.post('/sendOrderToDelivery', [
    validarJWT,
    validarCampos
], sendOrderToDelivery)  

router.post('/cancelOrder', [
    validarJWT,
    validarCampos
], cancelOrder)  

module.exports = router