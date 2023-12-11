const { Router } = require('express')
const { validarCampos } = require('../middlewares/validar-campos')
const { validarJWT } = require('../middlewares/validar-jwt')
const { backupDatabase } = require('../controllers/backup')

const router = Router()

router.post('/createBackup', [
    validarJWT,
    validarCampos
], backupDatabase)  

module.exports = router