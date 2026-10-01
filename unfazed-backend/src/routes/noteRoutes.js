const express = require('express');
const router  = express.Router();
const {
  getNotes, getNoteBySession, getNote, updateNote,
  signNote, deleteNote, toggleVisibility, getSharedNotes,
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',                       getNotes);
router.get('/session/:sessionId',     getNoteBySession);
router.get('/shared/:clientId',       getSharedNotes);       // Module 5 — shared notes for client
router.route('/:id')
  .get(getNote)
  .put(updateNote)
  .delete(deleteNote);
router.put('/:id/sign',               signNote);
router.put('/:id/visibility',         toggleVisibility);     // Module 5 — toggle private/shared

module.exports = router;
