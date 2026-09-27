const SessionNote = require('../models/SessionNote');
const Session = require('../models/Session');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, clientId, search } = req.query;
  const skip = (page - 1) * limit;

  const query = { therapist: req.user._id };
  if (clientId) query.client = clientId;
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { subjective: regex }, { objective: regex },
      { assessment: regex }, { plan: regex },
      { content: regex },
    ];
  }

  const [notes, total] = await Promise.all([
    SessionNote.find(query)
      .populate('client', 'firstName lastName avatar')
      .populate({ path: 'session', select: 'startTime type modality status' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    SessionNote.countDocuments(query),
  ]);

  return paginatedResponse(res, notes, total, page, limit);
});

// @desc    Get note by session ID
// @route   GET /api/notes/session/:sessionId
// @access  Private
const getNoteBySession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.sessionId, therapist: req.user._id });
  if (!session) return errorResponse(res, 'Session not found', 404);

  let note = await SessionNote.findOne({ session: req.params.sessionId })
    .populate('client', 'firstName lastName avatar')
    .populate({ path: 'session', select: 'startTime type modality status duration rate' });

  // Auto-create empty note if doesn't exist
  if (!note) {
    note = await SessionNote.create({
      session: session._id,
      therapist: req.user._id,
      client: session.client,
    });
    // Link note to session
    await Session.findByIdAndUpdate(session._id, { noteId: note._id });
    await note.populate('client', 'firstName lastName avatar');
    await note.populate({ path: 'session', select: 'startTime type modality status duration rate' });
  }

  return successResponse(res, { note });
});

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
const getNote = asyncHandler(async (req, res) => {
  const note = await SessionNote.findOne({ _id: req.params.id, therapist: req.user._id })
    .populate('client', 'firstName lastName avatar')
    .populate({ path: 'session', select: 'startTime type modality status' });

  if (!note) return errorResponse(res, 'Note not found', 404);
  return successResponse(res, { note });
});

// @desc    Create/Update note for a session
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = asyncHandler(async (req, res) => {
  const note = await SessionNote.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!note) return errorResponse(res, 'Note not found', 404);
  if (note.isLocked) return errorResponse(res, 'This note is locked and cannot be edited', 403);

  const allowedFields = [
    'format', 'subjective', 'objective', 'assessment', 'plan',
    'data', 'content', 'diagnosisCodes', 'homework', 'followUp',
    'clientMood', 'riskLevel', 'suicidalIdeation',
  ];

  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) note[f] = req.body[f];
  });

  await note.save();
  await note.populate('client', 'firstName lastName avatar');
  return successResponse(res, { note }, 'Note saved');
});

// @desc    Sign & lock note
// @route   PUT /api/notes/:id/sign
// @access  Private
const signNote = asyncHandler(async (req, res) => {
  const note = await SessionNote.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!note) return errorResponse(res, 'Note not found', 404);
  if (note.isSigned) return errorResponse(res, 'Note already signed', 400);

  note.isSigned = true;
  note.signedAt = new Date();
  note.isLocked = true;
  await note.save();

  return successResponse(res, { note }, 'Note signed and locked');
});

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
  const note = await SessionNote.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!note) return errorResponse(res, 'Note not found', 404);
  if (note.isLocked) return errorResponse(res, 'Cannot delete a locked/signed note', 403);

  await note.deleteOne();
  await Session.findByIdAndUpdate(note.session, { noteId: null });

  return successResponse(res, {}, 'Note deleted');
});

module.exports = { getNotes, getNoteBySession, getNote, updateNote, signNote, deleteNote };
