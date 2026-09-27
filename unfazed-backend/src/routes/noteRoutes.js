const express = require('express');
const router = express.Router();
const { getNotes, getNoteBySession, getNote, updateNote, signNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotes);
router.get('/session/:sessionId', getNoteBySession);
router.route('/:id').get(getNote).put(updateNote).delete(deleteNote);
router.put('/:id/sign', signNote);

module.exports = router;
