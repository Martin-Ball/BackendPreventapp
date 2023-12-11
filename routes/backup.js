const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { backupDatabase, restoreDatabase } = require('../controllers/backup')

const router = Router()

router.post('/createBackup', [
    validarJWT,
    validarCampos
], backupDatabase)  

router.post('/restoreBackup', [
    validarJWT,
    validarCampos
], restoreDatabase)  

module.exports = router