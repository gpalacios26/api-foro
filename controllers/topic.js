'use strict'

var validator = require('validator');

var Topic = require('../models/topic');

var controller = {

    test: (req, res) => {
        return res.status(200).send({
            message: 'Soy la acción test de mi controlador topic'
        });
    },

    save: (req, res) => {
        // Recoger parametros por post
        var params = req.body;

        // Validar datos (validator)
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
            var validate_lang = !validator.isEmpty(params.lang);
        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        if (validate_title && validate_content && validate_lang) {

            //Crear el objeto a guardar
            var topic = new Topic();

            // Asignar valores
            topic.title = params.title;
            topic.content = params.content;
            topic.code = params.code;
            topic.lang = params.lang;
            topic.user = req.user.sub;

            // Guardar el topic
            topic.save((err, topicStored) => {
                if (err || !topicStored) {
                    return res.status(200).send({
                        status: 'error',
                        message: 'El topic no se ha guardado !!!'
                    });
                }

                // Devolver una respuesta correcta
                return res.status(200).send({
                    status: 'success',
                    message: 'El topic se ha guardado correctamente',
                    topic: topicStored
                });
            });

        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son válidos !!!'
            });
        }
    },

    getTopics: (req, res) => {
        // Recoger la página actual
        if (!req.params.page || req.params.page == 0 || req.params.page == null || req.params.page == undefined) {
            var page = 1;
        } else {
            var page = parseInt(req.params.page);
        }

        // Configurar opciones de paginación
        var options = {
            sort: { date: -1 },
            populate: 'user',
            limit: 5,
            page: page
        };

        // Listar con paginación
        Topic.paginate({}, options, (err, topics) => {
            if (err) {
                return res.status(200).send({
                    status: 'error',
                    message: 'Error al realizar la consulta'
                });
            }

            if (!topics) {
                return res.status(200).send({
                    status: 'error',
                    message: 'No hay topics para mostrar !!!'
                });
            }

            // Devolver una respuesta correcta
            return res.status(200).send({
                status: 'success',
                topics: topics.docs,
                totalDocs: topics.totalDocs,
                totalPages: topics.totalPages
            });
        });
    },

    getTopicsByUser: (req, res) => {
        // Recoger el id de la url
        var userId = req.params.id;

        // Comprobar que existe
        if (!userId || userId == null) {
            return res.status(200).send({
                status: 'error',
                message: 'No existe el id del usuario !!!'
            });
        }

        // Buscar los topics por el usuario
        Topic.find({ user: userId }).sort([['date', 'descending']]).exec((err, topics) => {
            if (err) {
                return res.status(200).send({
                    status: 'error',
                    message: 'Error al realizar la consulta'
                });
            }

            if (!topics) {
                return res.status(200).send({
                    status: 'error',
                    message: 'No hay topics para mostrar !!!'
                });
            }

            // Devolver una respuesta correcta
            return res.status(200).send({
                status: 'success',
                topics: topics
            });
        });
    },

    getTopic: (req, res) => {
        // Recoger el id de la url
        var topicId = req.params.id;

        // Comprobar que existe
        if (!topicId || topicId == null) {
            return res.status(200).send({
                status: 'error',
                message: 'No existe el id del topic !!!'
            });
        }

        // Buscar el topic
        Topic.findById(topicId).populate('user').populate('comments.user').exec((err, topic) => {
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

            // Devolver una respuesta correcta
            return res.status(200).send({
                status: 'success',
                topic: topic
            });
        });
    },

    update: (req, res) => {
        // Recoger el id del articulo por la url
        var topicId = req.params.id;

        // Recoger los datos que llegan por put
        var params = req.body;

        // Validar datos
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
            var validate_lang = !validator.isEmpty(params.lang);
        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        if (validate_title && validate_content && validate_lang) {

            //Crear el objeto a actualizar
            var update = {};

            // Asignar valores
            update.title = params.title;
            update.content = params.content;
            update.code = params.code;
            update.lang = params.lang;

            // Actualizar el topic
            Topic.findOneAndUpdate({ _id: topicId, user: req.user.sub }, update, { new: true }, (err, topicUpdated) => {
                if (err || !topicUpdated) {
                    return res.status(200).send({
                        status: 'error',
                        message: 'El topic no se ha actualizado !!!'
                    });
                }

                // Devolver una respuesta correcta
                return res.status(200).send({
                    status: 'success',
                    message: 'El topic se ha actualizado correctamente',
                    topic: topicUpdated
                });
            });

        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son válidos !!!'
            });
        }
    },

    delete: (req, res) => {
        // Recoger el id de la url
        var topicId = req.params.id;

        // Eliminar el topic
        Topic.findOneAndDelete({ _id: topicId, user: req.user.sub }, (err, topicRemoved) => {
            if (err || !topicRemoved) {
                return res.status(200).send({
                    status: 'error',
                    message: 'El topic no se ha eliminado !!!'
                });
            }

            // Devolver una respuesta correcta
            return res.status(200).send({
                status: 'success',
                message: 'El topic se ha eliminado correctamente',
                topic: topicRemoved
            });
        });
    },

    search: (req, res) => {
        // Sacar el string a buscar
        var searchString = req.params.search;

        // Find or
        Topic.find({
            "$or": [
                { "title": { "$regex": searchString, "$options": "i" } },
                { "content": { "$regex": searchString, "$options": "i" } },
                { "code": { "$regex": searchString, "$options": "i" } },
                { "lang": { "$regex": searchString, "$options": "i" } }
            ]
        })
            .populate('user')
			.sort([['date', 'descending']])
            .exec((err, topics) => {
                if (err) {
                    return res.status(200).send({
                        status: 'error',
                        message: 'Error al realizar la consulta'
                    });
                }

                if (!topics || topics.length <= 0) {
                    return res.status(200).send({
                        status: 'error',
                        message: 'No hay topics que coincidan con tu busqueda !!!'
                    });
                }

                // Devolver una respuesta correcta
                return res.status(200).send({
                    status: 'success',
                    topics: topics
                });
            });
    },
};

module.exports = controller;