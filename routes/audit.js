const { Router } = require('express')
const { check } = require('express-validator')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { getLoginUser, getTurnoverUser, getRecommendedReports, getOrdersChangeState, getProductPriceAudit } = require('../controllers/audit')

const router = Router()

router.get('/getLoginUser', [
    validarJWT,
    validarCampos
], getLoginUser) 

router.get('/getTurnoverUser', [
    validarJWT,
    validarCampos
], getTurnoverUser) 

router.get('/getReportsRecommendedUser', [
    validarJWT,
    validarCampos
], getRecommendedReports) 

router.get('/getChangeStateUser', [
    validarJWT,
    validarCampos
], getOrdersChangeState) 

router.get('/getProductsPrice', [
    validarJWT,
    validarCampos
], getProductPriceAudit) 

module.exports = router