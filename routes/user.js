'use strict'

var express = require('express');
var UserController = require('../controllers/user');

var router = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({ uploadDir: './upload/users' });

// Ruta de prueba
router.get('/test', UserController.test);

// Rutas del aplicativo
router.post('/register', UserController.save);
router.post('/login', UserController.login);
router.put('/update', md_auth.authenticated, UserController.update);
router.post('/upload-avatar', [md_auth.authenticated, md_upload], UserController.uploadAvatar);
router.get('/avatar/:image', UserController.getAvatar);
router.get('/users', UserController.getUsers);
router.get('/user/:id', UserController.getUser);

module.exports = router;