'use strict'

var validator = require('validator');

var Topic = require('../models/topic');

var controller = {

    add: (req, res) => {
        // Recoger el id de la url
        var topicId = req.params.topicId;

        // Comprobar que existe
        if (!topicId || topicId == null) {
            return res.status(200).send({
                status: 'error',
                message: 'No existe el id del topic !!!'
            });
        }

        // Comprobar que existe el topic
        Topic.findById(topicId).exec((err, topic) => {
            if (err) {
                return res.status(200).send({
                    status: 'error',
                    message: 'Error al realizar la consulta'
                });
            }

            if (!topic) {
                return res.status(200).send({
                    status: 'error',
                    message: 'No existe el topic !!!'
                });
            }

            // Comprobar usuario y validar los datos
            if (req.body.content) {
                // Validar datos (validator)
                try {
                    var validate_content = !validator.isEmpty(req.body.content);
                } catch (err) {
                    return res.status(200).send({
                        status: 'error',
                        message: 'Faltan datos por enviar !!!'
                    });
                }

                if (validate_content) {
                    //Crear el objeto comment
                    var comment = {};

                    // Asignar valores
                    comment.user = req.user.sub;
                    comment.content = req.body.content;

                    // Agregar el objeto en la propiedad comments
                    topic.comments.push(comment);

                    // Guardar el topic
                    topic.save((err, topicStored) => {
                        if (err || !topicStored) {
                            return res.status(200).send({
                                status: 'error',
                                message: 'El comentario no se ha guardado !!!'
                            });
                        }

                        // Devolver una respuesta correcta
                        return res.status(200).send({
                            status: 'success',
                            message: 'El comentario se ha guardado correctamente',
                            topic: topicStored
                        });
                    });

                } else {
                    return res.status(200).send({
                        status: 'error',
                        message: 'Los datos no son válidos !!!'
                    });
                }
            } else {
                return res.status(200).send({
                    status: 'error',
                    message: 'No se han enviado datos !!!'
                });
            }
        });
    },

    update: (req, res) => {
        // Recoger el id de la url
        var commentId = req.params.commentId;

        // Comprobar que existe
        if (!commentId || commentId == null) {
            return res.status(200).send({
                status: 'error',
                message: 'No existe el id del comentario !!!'
            });
        }

        // Comprobar usuario y validar los datos
        if (req.body.content) {
            // Validar datos (validator)
            try {
                var validate_content = !validator.isEmpty(req.body.content);
            } catch (err) {
                return res.status(200).send({
                    status: 'error',
                    message: 'Faltan datos por enviar !!!'
                });
            }

            if (validate_content) {
                // Actualizar el topic
                Topic.findOneAndUpdate({ "comments._id": commentId }, { "$set": { "comments.$.content": req.body.content } }, { new: true }, (err, topicUpdated) => {
                    if (err || !topicUpdated) {
                        return res.status(200).send({
                            status: 'error',
                            message: 'El comentario no se ha actualizado !!!'
                        });
                    }

                    // Devolver una respuesta correcta
                    return res.status(200).send({
                        status: 'success',
                        message: 'El comentario se ha actualizado correctamente',
                        topic: topicUpdated
                    });
                });
            } else {
                return res.status(200).send({
                    status: 'error',
                    message: 'Los datos no son válidos !!!'
                });
            }
        } else {
            return res.status(200).send({
                status: 'error',
                message: 'No se han enviado datos !!!'
            });
        }
    },

    delete: (req, res) => {
        // Recoger los id de la url
        var topicId = req.params.topicId;
        var commentId = req.params.commentId;

        // Comprobar que existe
        if (!topicId || topicId == null) {
            return res.status(200).send({
                status: 'error',
                message: 'No existe el id del topic !!!'
            });
        }

        if (!commentId || commentId == null) {
            return res.status(200).send({
                status: 'error',
                message: 'No existe el id del comentario !!!'
            });
        }

        // Buscar el topic
        Topic.findById(topicId).populate('user').exec((err, topic) => {
            if (err) {
                return res.status(200).send({
                    status: 'error',
                    message: 'Error al realizar la consulta'
                });
            }

            if (!topic) {
                return res.status(200).send({
                    status: 'error',
                    message: 'No existe el topic !!!'
                });
            }

            // Seleccionar el subdocumento (comentario)
            var comment = topic.comments.id(commentId);

            // Borrar el comentario
            if (comment) {
                comment.remove();

                // Guardar el topic
                topic.save((err, topicStored) => {
                    if (err || !topicStored) {
                        return res.status(200).send({
                            status: 'error',
                            message: 'El comentario no se ha eliminado !!!'
                        });
                    }

                    // Devolver una respuesta correcta
                    return res.status(200).send({
                        status: 'success',
                        message: 'El comentario se ha eliminado correctamente',
                        topic: topicStored
                    });
                });

            } else {
                return res.status(200).send({
                    status: 'error',
                    message: 'No existe el id del comentario !!!'
                });
            }
        });
    },
};

module.exports = controller;