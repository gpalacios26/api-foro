'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = 'clave-secreta-token-9999';

exports.authenticated = function (req, res, next) {

    // Comprobar si llega la autorizacion
    if (!req.headers.authorization) {
        return res.status(200).send({
            status: 'error',
            message: 'La petición no tiene la autorización !!!'
        });
    }

    // Decodificar el token
    var token = req.headers.authorization;
    try {
        var payload = jwt.decode(token, key);
        // Comprobar si el token ha expirado
        if (payload.exp <= moment().unix()) {
            return res.status(200).send({
                status: 'error',
                message: 'EL token ha expirado'
            });
        }
    } catch (ex) {
        return res.status(200).send({
            status: 'error',
            message: 'EL token no es válido'
        });
    }

    // Adjuntar el usuario identificado a request
    req.user = payload;

    // Pasar a la acción
    next();
};