const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { 
    getPermissionsByUser,
    getUsers,
    updatePermissionsState,
    updatePasswordAndGroup,
    deleteUser 
} = require('../controllers/users')

const router = Router()

router.get('/getPermissions', [
    validarJWT,
    validarCampos
], getPermissionsByUser)  

router.get('/getUsers', [
    validarJWT,
    validarCampos
], getUsers)

router.patch('/updatePermissions', [
    validarJWT,
    validarCampos
], updatePermissionsState)

router.patch('/updateUser', [
    validarJWT,
    validarCampos
], updatePasswordAndGroup)

router.post('/deleteUser', [
    validarJWT,
    validarCampos
], deleteUser)

module.exports = router