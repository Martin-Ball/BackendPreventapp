const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { 
    newOrder,
    getNewOrders, 
    sendOrderToDelivery, 
    cancelOrder, 
    getOrdersByDate, 
    orderDelivered, 
    notDeliverOrder 
} = require('../controllers/orders')

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

router.post('/orderDelivered', [
    validarJWT,
    validarCampos
], orderDelivered)  

router.post('/notDeliverOrder', [
    validarJWT,
    validarCampos
], notDeliverOrder)  

router.get('/getOrdersByDate', [
    validarJWT,
    validarCampos
], getOrdersByDate)

module.exports = router