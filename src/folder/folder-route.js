'use strict';

const express = require('express');
const FolderService = require('./folder-service');
const NoteService = require('../notes/note-service');
const folderRouter = express.Router();
const xss = require('xss');
const uuid = require('uuid/v4');
const logger = require('../logger');
const bodyParser = express.json();

const serializeFolder = folder => ({
  id: folder.id,
  name: xss(folder.name)
});

const sanitizeNote = note => ({
  id: note.id,
  name: xss(note.name),
  content: xss(note.content),
  modified: xss(note.modified),
  folderId: xss(note.folderId)
});

folderRouter.route('/folder')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    FolderService.getAllFolders(knexInstance)
      .then(folders => {
        res.json(folders.map(folder => serializeFolder(folder)));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { name } = req.body;
    
    const newFolder = { name };

    FolderService.insertFolder(knexInstance, newFolder).then(folder => {
      res.status(201)
        .json(serializeFolder(folder));
    })
      .catch(next);
  });

folderRouter.route('/folder/:folderId')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { folderId } = req.params;

    NoteService.getAllNotes(knexInstance, folderId)
      .then(notes => {
        const filter = notes.filter(note => {
          if (note.folderid ===  parseInt(folderId) ) {
            return note;
          }
        });
        console.log(filter.length);
        if (filter === undefined) {
          logger.error(`Folder ${folderId} not found.`);
          return res
            .status(404)
            .json({ error: {message: `Folder ${folderId} does not exist`}});
        }
        res.status(201).json(filter);
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { folderid } = req.params;
    const { name, content, modified } = req.body;

    
    const newNote = { name, content, modified, folderid };
    console.log(newNote);
    NoteService.insertNote(knexInstance, newNote).then(note => {
      res.status(201)
        .json(sanitizeNote(note));
    })
      .catch(next);
  })
  .delete((req, res) =>  {
    const knexInstance = req.app.get('db');
    const { folderId } = req.params;

    FolderService.deleteFolder(knexInstance, folderId)
      .then(folder => {
        if (!folder) {
          logger.error(`Folder with ${folderId} not found.`);
          return res
            .status(404)
            .json({ error: {message: `Folder ${folderId} does not exist`}});
        }
        logger.info(`Folder with id ${folderId} deleted`);
        res.status(204).end();
      });
  })
  .patch((req, res) => {
    const knexInstance = req.app.get('db');
    const { folderId } = req.params;
    const { name } = req.body;

    FolderService.updateFolder(knexInstance, folderId, name)
      .then(folder => {
        if (!folder) {
          logger.error(`Folder with ${folderId} not found.`);
          return res
            .status(404)
            .json({ error: {message: `Folder ${folderId} does not exists`}});
        }
        logger.info(`Folder with id ${folderId} has been updated`);
        res.status(204).end();
      });
  });

module.exports = folderRouter;
