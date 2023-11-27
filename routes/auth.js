const { Router } = require('express')
const { check } = require('express-validator')
const { login, renewToken, register } = require('../controllers/auth')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')

const router = Router()

router.post('/login', [
    check('username', 'El correo es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    validarCampos
], login)  

router.get('/renewToken', renewToken);

router.post('/register', [
    check('username', 'El correo es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    validarCampos
], register)  

module.exports = router