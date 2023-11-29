const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { getPermissionsByUser, getUsers } = require('../controllers/users')

const router = Router()

router.get('/getPermissions', [
    validarJWT,
    validarCampos
], getPermissionsByUser)  

router.get('/getUsers', [
    validarJWT,
    validarCampos
], getUsers)
module.exports = router