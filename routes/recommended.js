const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { 
    getRecommendedProducts
} = require('../controllers/recommended')

const router = Router()

router.get('/getRecommendedProducts', [
    validarJWT,
    validarCampos
], getRecommendedProducts)  

module.exports = router