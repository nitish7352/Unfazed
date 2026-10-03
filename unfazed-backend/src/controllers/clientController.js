const Client = require('../models/Client');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const ClientProfile = require('../models/ClientProfile');
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
    Client.find(query).populate('user', 'firstName lastName email avatar phone createdAt').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Client.countDocuments(query),
  ]);

  return paginatedResponse(res, clients, total, page, limit);
});

// @desc    Get single client with full profile and booking history
// @route   GET /api/clients/:id
// @access  Private
const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id)
    .populate('user', 'firstName lastName email avatar phone createdAt')
    .populate('therapist', 'firstName lastName email avatar phone');

  if (!client) return errorResponse(res, 'Client not found', 404);

  // Security: only authorized therapist, client themselves, or admin
  const isTherapist = client.therapist?._id?.toString() === req.user._id.toString() || client.therapist?.toString() === req.user._id.toString();
  const isClient = (client.user && client.user._id?.toString() === req.user._id.toString()) ||
                   (client.user && client.user.toString() === req.user._id.toString()) ||
                   client.email === req.user.email;
  const isAdmin = req.user.role === 'admin';

  if (!isTherapist && !isClient && !isAdmin) {
    return errorResponse(res, 'Not authorized to view this client profile', 403);
  }

  let clientProfile = null;
  if (client.user) {
    clientProfile = await ClientProfile.findOne({ user: client.user._id || client.user });
  }

  const [appointments, sessions, invoices] = await Promise.all([
    Booking.find({ client: client._id }).sort({ startTime: -1 }).limit(20),
    Session.find({ client: client._id }).sort({ startTime: -1 }).limit(20),
    Invoice.find({ client: client._id }).sort({ createdAt: -1 }).limit(20),
  ]);

  return successResponse(res, {
    client,
    clientProfile,
    appointments,
    sessions,
    invoices,
  });
});

// @desc    Get logged in client's own profile and associated therapist records
// @route   GET /api/clients/my
// @access  Private (client)
const getMyClient = asyncHandler(async (req, res) => {
  const clientProfile = await ClientProfile.findOne({ user: req.user._id });
  const clientRecords = await Client.find({
    $or: [{ user: req.user._id }, { email: req.user.email }],
  }).populate('therapist', 'firstName lastName email avatar phone');

  return successResponse(res, {
    user: req.user,
    clientProfile,
    clientRecords,
  });
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
  getMyClient,
  createClient,
  updateClient,
  deleteClient,
  updateIntakeForm,
  getClientSessions,
};
