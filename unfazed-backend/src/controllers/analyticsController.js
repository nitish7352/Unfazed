const Session = require('../models/Session');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

// @desc    Dashboard summary stats
// @route   GET /api/analytics/summary
// @access  Private
const getSummary = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());

  const [
    totalClients, activeClients,
    sessionsThisMonth, sessionsThisWeek,
    upcomingSessions,
    revenueThisMonth, totalRevenue,
    pendingInvoices,
  ] = await Promise.all([
    Client.countDocuments({ therapist: therapistId }),
    Client.countDocuments({ therapist: therapistId, status: 'active' }),
    Session.countDocuments({ therapist: therapistId, startTime: { $gte: startOfMonth }, status: { $in: ['completed', 'in_progress'] } }),
    Session.countDocuments({ therapist: therapistId, startTime: { $gte: startOfWeek }, status: { $in: ['completed', 'in_progress'] } }),
    Session.countDocuments({ therapist: therapistId, startTime: { $gte: now }, status: { $in: ['scheduled', 'confirmed'] } }),
    Invoice.aggregate([
      { $match: { therapist: therapistId, status: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { therapist: therapistId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.countDocuments({ therapist: therapistId, status: { $in: ['sent', 'overdue'] } }),
  ]);

  return successResponse(res, {
    totalClients,
    activeClients,
    sessionsThisMonth,
    sessionsThisWeek,
    upcomingSessions,
    revenueThisMonth: revenueThisMonth[0]?.total || 0,
    totalRevenue:     totalRevenue[0]?.total || 0,
    pendingInvoices,
  });
});

// @desc    Monthly revenue chart data (last 12 months)
// @route   GET /api/analytics/revenue
// @access  Private
const getRevenueChart = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;
  const months = 12;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const data = await Invoice.aggregate([
    {
      $match: {
        therapist: therapistId,
        status:    'paid',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue:  { $sum: '$total' },
        count:    { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return successResponse(res, { data });
});

// @desc    Sessions per week (last 8 weeks)
// @route   GET /api/analytics/sessions
// @access  Private
const getSessionChart = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 56); // 8 weeks

  const data = await Session.aggregate([
    {
      $match: {
        therapist: therapistId,
        startTime: { $gte: startDate },
        status:    { $in: ['completed', 'in_progress'] },
      },
    },
    {
      $group: {
        _id: { $week: '$startTime' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id': 1 } },
  ]);

  return successResponse(res, { data });
});

// @desc    Client growth (new clients per month, last 6 months)
// @route   GET /api/analytics/clients
// @access  Private
const getClientChart = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);

  const data = await Client.aggregate([
    { $match: { therapist: therapistId, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return successResponse(res, { data });
});

// @desc    Top clients by session count
// @route   GET /api/analytics/top-clients
// @access  Private
const getTopClients = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;

  const data = await Session.aggregate([
    { $match: { therapist: therapistId, status: 'completed' } },
    { $group: { _id: '$client', sessionCount: { $sum: 1 }, totalRevenue: { $sum: '$rate' } } },
    { $sort: { sessionCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client',
      },
    },
    { $unwind: '$client' },
    {
      $project: {
        sessionCount: 1,
        totalRevenue: 1,
        'client.firstName': 1,
        'client.lastName':  1,
        'client.avatar':    1,
      },
    },
  ]);

  return successResponse(res, { data });
});

module.exports = { getSummary, getRevenueChart, getSessionChart, getClientChart, getTopClients };
