const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { newList, getListPrices } = require('../controllers/pricesList')

const router = Router()

router.post('/newList', [
    validarJWT,
    validarCampos
], newList)  

router.get('/getList', [
    validarJWT,
    validarCampos
], getListPrices)  

module.exports = router