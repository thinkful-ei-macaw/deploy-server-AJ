'use strict';
const express = require('express');
const NoteService = require('./note-service');
const noteRouter = express.Router();
const xss = require('xss');
const bodyParser = express.json();
const notes = require('../store');
const logger = require('../logger');

const sanitizeNote = note => ({
  id: note.id,
  name: xss(note.name),
  content: xss(note.content),
  modified: note.modified,
  folderId: note.folderId
});


noteRouter.route('/note')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    NoteService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(note => sanitizeNote(note)));
      })
      .catch(next);
  });

noteRouter.route('/note/:noteId')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { id } = req.params;

    NoteService.getById(knexInstance, id)
      .then(note => {
        if (!note) {
          logger.error(`Note with ${id} not found.`);
          return res
            .status(404)
            .json({ error: {message: 'Note does not exist'}});
        }
        res.json(sanitizeNote(note));
      })
      .catch(next);
  })
  .delete((req, res) =>  {
    const knexInstance = req.app.get('db');
    const { id } = req.params;

    NoteService.deleteFolder(knexInstance, id)
      .then(note => {
        if (!note) {
          logger.error(`Note with ${id} not found.`);
          return res
            .status(404)
            .json({ error: {message: 'Note does not exist'}});
        }
        logger.info(`Note with id ${id} deleted`);
        res.status(204).end();
      });
  })
  .patch((req, res) => {
    const knexInstance = req.app.get('db');
    const { id } = req.params;
    const { name } = bodyParser;

    NoteService.updateNote(knexInstance, id, name)
      .then(note => {
        if (!note) {
          logger.error(`Note with ${id} not found.`);
          return res
            .status(404)
            .json({ error: {message: 'Note does not exists'}});
        }
        logger.info(`Note with id ${id} has been updated`);
        res.status(204).end();
      });
  });


module.exports = noteRouter;