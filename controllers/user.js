'use strict'

var validator = require('validator');
var bcrypt = require('bcryptjs');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var jwt = require('../services/jwt');

var controller = {

    test: (req, res) => {
        return res.status(200).send({
            message: 'Soy la acción test de mi controlador user'
        });
    },

    save: (req, res) => {
        // Recoger parametros por post
        var params = req.body;

        // Validar datos (validator)
        try {
            var validate_name = !validator.isEmpty(params.name);
            var validate_surname = !validator.isEmpty(params.surname);
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
            var validate_password = !validator.isEmpty(params.password);
        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Debe completar los datos para poder registrar !!!'
            });
        }

        if (validate_name && validate_surname && validate_email && validate_password) {

            // Comprobar si el usuario existe
            User.findOne({ email: params.email }, (err, issetUser) => {
                if (err) {
                    return res.status(200).send({
                        status: 'error',
                        message: 'Error al comprobar la duplicidad de usuario'
                    });
                }

                if (!issetUser) {
                    //Crear el objeto a guardar
                    var user = new User();

                    // Asignar valores
                    user.name = params.name;
                    user.surname = params.surname;
                    user.email = params.email;
                    user.role = 'ROLE_USER';

                    if (params.image) {
                        user.image = params.image;
                    } else {
                        user.image = null;
                    }

                    // Cifrar la contraseña
                    bcrypt.hash(params.password, 8, function (err, hash) {
                        if (err) {
                            return res.status(200).send({
                                status: 'error',
                                message: 'Error al cifrar la contraseña'
                            });
                        }

                        if (hash) {
                            user.password = hash;
                            // Guardar el usuario
                            user.save((err, userStored) => {
                                if (err || !userStored) {
                                    return res.status(200).send({
                                        status: 'error',
                                        message: 'El usuario no se ha registrado !!!'
                                    });
                                }

                                // Limpiar campo password
                                userStored.password = undefined;

                                // Devolver una respuesta correcta
                                return res.status(200).send({
                                    status: 'success',
                                    message: 'Usuario registrado correctamente',
                                    user: userStored
                                });
                            });
                        } else {
                            return res.status(200).send({
                                status: 'error',
                                message: 'Error al cifrar la contraseña'
                            });
                        }
                    });
                } else {
                    return res.status(200).send({
                        status: 'error',
                        message: 'El usuario ya esta registrado'
                    });
                }
            });

        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son válidos !!!'
            });
        }
    },

    login: (req, res) => {
        // Recoger parametros por post
        var params = req.body;

        // Validar datos (validator)
        try {
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
            var validate_password = !validator.isEmpty(params.password);
        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Debe completar los datos !!!'
            });
        }

        if (validate_email && validate_password) {

            // Buscar el usuario por email
            User.findOne({ email: params.email }, (err, issetUser) => {
                if (err) {
                    return res.status(200).send({
                        status: 'error',
                        message: 'Error al buscar el usuario'
                    });
                }

                if (issetUser) {
                    // Comprobar la contraseña del usuario
                    bcrypt.compare(params.password, issetUser.password, function (err, check) {
                        if (err) {
                            return res.status(200).send({
                                status: 'error',
                                message: 'Error al identificar el usuario'
                            });
                        }

                        if (check) {
                            // Generar token de jwt y devolverlo
                            if (params.getToken) {
                                return res.status(200).send({
                                    token: jwt.createToken(issetUser)
                                });
                            } else {
                                // Limpiar campo password
                                issetUser.password = undefined;

                                // Devolver una respuesta correcta
                                return res.status(200).send({
                                    status: 'success',
                                    message: 'Usuario identificado correctamente',
                                    user: issetUser
                                });
                            }
                        } else {
                            return res.status(200).send({
                                status: 'error',
                                message: 'Las credenciales no son correctas'
                            });
                        }
                    });
                } else {
                    return res.status(200).send({
                        status: 'error',
                        message: 'El usuario no esta registrado'
                    });
                }
            });

        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son válidos !!!'
            });
        }
    },

    update: (req, res) => {
        // Recoger parametros por post
        var params = req.body;

        // Validar datos (validator)
        try {
            var validate_name = !validator.isEmpty(params.name);
            var validate_surname = !validator.isEmpty(params.surname);
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Debe completar los datos para poder actualizar !!!'
            });
        }

        // Eliminar propiedades innecesarias
        delete params.password;

        if (validate_name && validate_surname && validate_email) {

            var userId = req.user.sub;

            // Comprobar si el usuario es unico
            if (req.user.email != params.email) {

                User.findOne({ email: params.email }, (err, issetUser) => {
                    if (err) {
                        return res.status(200).send({
                            status: 'error',
                            message: 'Error al buscar el usuario por email'
                        });
                    }

                    if (issetUser && issetUser.email == params.email && issetUser._id != userId) {
                        return res.status(200).send({
                            status: 'error',
                            message: 'El email no puede ser modificado porque ya existe'
                        });
                    } else {
                        // Buscar y actualizar usuario
                        User.findOneAndUpdate({ _id: userId }, params, { new: true }, (err, userUpdated) => {
                            if (err || !userUpdated) {
                                return res.status(500).send({
                                    status: 'error',
                                    message: 'Error al actualizar el usuario !!!'
                                });
                            }

                            // Limpiar campo password
                            userUpdated.password = undefined;

                            // Devolver una respuesta correcta
                            return res.status(200).send({
                                status: 'success',
                                message: 'Usuario actualizado correctamente',
                                user: userUpdated
                            });
                        });
                    }

                });

            } else {
                // Buscar y actualizar usuario
                User.findOneAndUpdate({ _id: userId }, params, { new: true }, (err, userUpdated) => {
                    if (err || !userUpdated) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Error al actualizar el usuario !!!'
                        });
                    }

                    // Limpiar campo password
                    userUpdated.password = undefined;

                    // Devolver una respuesta correcta
                    return res.status(200).send({
                        status: 'success',
                        message: 'Usuario actualizado correctamente',
                        user: userUpdated
                    });
                });
            }

        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son válidos !!!'
            });
        }
    },

    uploadAvatar: (req, res) => {
        // Recoger el fichero de la petición
        var file_name = 'Imagen no subida...';

        if (!req.files) {
            return res.status(404).send({
                status: 'error',
                message: file_name
            });
        }

        // Conseguir nombre y la extensión del archivo
        var file_path = req.files.file0.path;
        var file_split = file_path.split('\\');

        // * ADVERTENCIA * EN LINUX O MAC
        // var file_split = file_path.split('/');

        // Nombre del archivo
        var file_name = file_split[2];

        // Extensión del fichero
        var extension_split = file_name.split('\.');
        var file_ext = extension_split[1];

        // Comprobar la extension, solo imagenes, si no es valida borrar el fichero
        if (file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg' && file_ext != 'gif') {

            // Borrar el archivo subido
            fs.unlink(file_path, (err) => {
                return res.status(200).send({
                    status: 'error',
                    message: 'La extensión del archivo no es válida !!!'
                });
            });

        } else {
            // Si todo es valido, sacando id de la request
            var userId = req.user.sub;

            if (userId) {
                // Buscar el usuario, asignarle el nombre de la imagen y actualizarlo
                User.findOneAndUpdate({ _id: userId }, { image: file_name }, { new: true }, (err, userUpdated) => {
                    if (err || !userUpdated) {
                        return res.status(200).send({
                            status: 'error',
                            message: 'Error al guardar la imagen !!!'
                        });
                    }

                    // Limpiar campo password
                    userUpdated.password = undefined;

                    // Devolver una respuesta correcta
                    return res.status(200).send({
                        status: 'success',
                        message: 'Imagen subida correctamente',
                        user: userUpdated
                    });
                });
            } else {
                return res.status(200).send({
                    status: 'success',
                    image: file_name
                });
            }
        }
    },

    getAvatar: (req, res) => {
        var file = req.params.image;
        var path_file = './upload/users/' + file;

        fs.exists(path_file, (exists) => {
            if (exists) {
                return res.sendFile(path.resolve(path_file));
            } else {
                return res.status(200).send({
                    status: 'error',
                    message: 'La imagen no existe !!!'
                });
            }
        });
    },

    getUsers: (req, res) => {
        User.find({}).sort('-_id').exec((err, users) => {
            if (err || !users) {
                return res.status(200).send({
                    status: 'error',
                    message: 'No hay usuarios para mostrar !!!'
                });
            }

            // Devolver una respuesta correcta
            return res.status(200).send({
                status: 'success',
                users: users
            });
        });
    },

    getUser: (req, res) => {
        // Recoger el id de la url
        var userId = req.params.id;

        // Comprobar que existe
        if (!userId || userId == null) {
            return res.status(200).send({
                status: 'error',
                message: 'No existe el id del usuario !!!'
            });
        }

        // Buscar el usuario
        User.findById(userId, (err, user) => {
            if (err || !user) {
                return res.status(200).send({
                    status: 'error',
                    message: 'No existe el usuario !!!'
                });
            }

            // Devolverlo en json
            return res.status(200).send({
                status: 'success',
                user: user
            });
        });
    },
};

module.exports = controller;