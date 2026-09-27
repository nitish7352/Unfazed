const Client = require('../models/Client');
const Session = require('../models/Session');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// @desc    Get all clients for logged-in therapist
// @route   GET /api/clients
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search, tag } = req.query;
  const skip = (page - 1) * limit;

  const query = { therapist: req.user._id };

  if (status)  query.status = status;
  if (tag)     query.tags   = tag;
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { firstName: regex },
      { lastName:  regex },
      { email:     regex },
    ];
  }

  const [clients, total] = await Promise.all([
    Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Client.countDocuments(query),
  ]);

  return paginatedResponse(res, clients, total, page, limit);
});

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!client) return errorResponse(res, 'Client not found', 404);
  return successResponse(res, { client });
});

// @desc    Create client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const client = await Client.create({ ...req.body, therapist: req.user._id });
  return successResponse(res, { client }, 'Client created', 201);
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, therapist: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!client) return errorResponse(res, 'Client not found', 404);
  return successResponse(res, { client }, 'Client updated');
});

// @desc    Delete (archive) client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, therapist: req.user._id },
    { status: 'discharged' },
    { new: true }
  );
  if (!client) return errorResponse(res, 'Client not found', 404);
  return successResponse(res, {}, 'Client archived (discharged)');
});

// @desc    Update intake form
// @route   PUT /api/clients/:id/intake
// @access  Private
const updateIntakeForm = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, therapist: req.user._id },
    {
      intakeForm: { ...req.body, completedAt: new Date() },
    },
    { new: true, runValidators: true }
  );
  if (!client) return errorResponse(res, 'Client not found', 404);
  return successResponse(res, { client }, 'Intake form updated');
});

// @desc    Get client session history
// @route   GET /api/clients/:id/sessions
// @access  Private
const getClientSessions = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, therapist: req.user._id });
  if (!client) return errorResponse(res, 'Client not found', 404);

  const sessions = await Session.find({
    client: client._id,
    therapist: req.user._id,
  })
    .sort({ startTime: -1 })
    .limit(50);

  return successResponse(res, { sessions });
});

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  updateIntakeForm,
  getClientSessions,
};
