'use strict';
const FolderService = {
  getAllFolders(knex) {
    return knex('folders')
      .select('*')
      .from('folders');
  },
  getById(knex, id){
    return knex
      .from('folders')
      .select('*')
      .where('id', id)
      .first();
  },
  deleteFolder(knex, id) {
    return knex('folders')
      .where({ id })
      .delete();
  },
  insertFolder(knex, newFolder) {
    return knex
      .insert(newFolder)
      .into('folders')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },
  updateFolder(knex, id, newFolderFields) {
    return knex('folders')
      .where({ id })
      .update(newFolderFields);
  }
};

module.exports = FolderService;