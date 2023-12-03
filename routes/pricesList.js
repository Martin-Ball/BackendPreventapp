const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { newList } = require('../controllers/pricesList')

const router = Router()

router.post('/newList', [
    validarJWT,
    validarCampos
], newList)  

module.exports = router