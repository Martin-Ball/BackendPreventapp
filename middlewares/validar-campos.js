const { validationResult } = require('express-validator')

const validarCampos = (req, res, next) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json(errors)
    }

    //si llega a este punto seguir al proximo middleware
    next()
}

module.exports = {
    validarCampos
}