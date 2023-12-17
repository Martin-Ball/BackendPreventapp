const { Router } = require('express')
const { check } = require('express-validator')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { getLoginUser } = require('../controllers/audit')

const router = Router()

router.get('/getLoginUser', [
    validarJWT,
    validarCampos
], getLoginUser) 

module.exports = router