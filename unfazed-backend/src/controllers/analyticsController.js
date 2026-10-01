const Session  = require('../models/Session');
const Client   = require('../models/Client');
const Invoice  = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { canAccess } = require('../services/entitlementService');

// @desc    Dashboard summary stats (includes no-show rate)
// @route   GET /api/analytics/summary
// @access  Private
const getSummary = asyncHandler(async (req, res) => {
  const therapistId  = req.user._id;
  const now          = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek  = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const [
    totalClients, activeClients,
    sessionsThisMonth, sessionsThisWeek,
    upcomingSessions,
    noShowSessions, completedSessions,
    revenueThisMonth, totalRevenue,
    pendingInvoices,
  ] = await Promise.all([
    Client.countDocuments({ therapist: therapistId }),
    Client.countDocuments({ therapist: therapistId, status: 'active' }),
    Session.countDocuments({ therapist: therapistId, startTime: { $gte: startOfMonth }, status: { $in: ['completed', 'in_progress'] } }),
    Session.countDocuments({ therapist: therapistId, startTime: { $gte: startOfWeek },  status: { $in: ['completed', 'in_progress'] } }),
    Session.countDocuments({ therapist: therapistId, startTime: { $gte: now },          status: { $in: ['scheduled', 'confirmed'] } }),
    // No-show rate — last 30 days
    Session.countDocuments({ therapist: therapistId, startTime: { $gte: startOfMonth }, status: 'no_show' }),
    Session.countDocuments({ therapist: therapistId, startTime: { $gte: startOfMonth }, status: { $in: ['completed', 'no_show'] } }),
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

  // No-show rate as percentage (0–100), null if no data
  const noShowRate = completedSessions > 0
    ? Math.round((noShowSessions / completedSessions) * 100)
    : null;

  return successResponse(res, {
    totalClients,
    activeClients,
    sessionsThisMonth,
    sessionsThisWeek,
    upcomingSessions,
    noShowSessions,
    noShowRate,        // new — Module 7
    revenueThisMonth:  revenueThisMonth[0]?.total || 0,
    totalRevenue:      totalRevenue[0]?.total || 0,
    pendingInvoices,
  });
});

// @desc    Monthly revenue chart data (last 12 months)
// @route   GET /api/analytics/revenue
// @access  Private
const getRevenueChart = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;
  const startDate   = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const data = await Invoice.aggregate([
    { $match: { therapist: therapistId, status: 'paid', createdAt: { $gte: startDate } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return successResponse(res, { data });
});

// @desc    Sessions per week (last 8 weeks)
// @route   GET /api/analytics/sessions
// @access  Private
const getSessionChart = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;
  const startDate   = new Date();
  startDate.setDate(startDate.getDate() - 56);

  const data = await Session.aggregate([
    { $match: { therapist: therapistId, startTime: { $gte: startDate }, status: { $in: ['completed', 'in_progress'] } } },
    { $group: { _id: { $week: '$startTime' }, count: { $sum: 1 } } },
    { $sort: { '_id': 1 } },
  ]);

  return successResponse(res, { data });
});

// @desc    Client growth (new clients per month, last 6 months)
// @route   GET /api/analytics/clients
// @access  Private
const getClientChart = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;
  const startDate   = new Date();
  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);

  const data = await Client.aggregate([
    { $match: { therapist: therapistId, createdAt: { $gte: startDate } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
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
    { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
    { $unwind: '$client' },
    { $project: { sessionCount: 1, totalRevenue: 1, 'client.firstName': 1, 'client.lastName': 1, 'client.avatar': 1 } },
  ]);

  return successResponse(res, { data });
});

// @desc    No-show rate over last 6 months (monthly breakdown)
// @route   GET /api/analytics/no-show
// @access  Private
const getNoShowChart = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;
  const startDate   = new Date();
  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);

  const [noShows, completed] = await Promise.all([
    Session.aggregate([
      { $match: { therapist: therapistId, startTime: { $gte: startDate }, status: 'no_show' } },
      { $group: { _id: { year: { $year: '$startTime' }, month: { $month: '$startTime' } }, count: { $sum: 1 } } },
    ]),
    Session.aggregate([
      { $match: { therapist: therapistId, startTime: { $gte: startDate }, status: { $in: ['completed', 'no_show'] } } },
      { $group: { _id: { year: { $year: '$startTime' }, month: { $month: '$startTime' } }, count: { $sum: 1 } } },
    ]),
  ]);

  // Merge into monthly no-show % data
  const completedMap = {};
  completed.forEach((d) => { completedMap[`${d._id.year}-${d._id.month}`] = d.count; });

  const data = noShows.map((d) => {
    const key   = `${d._id.year}-${d._id.month}`;
    const total = completedMap[key] || 0;
    return {
      _id:      d._id,
      noShows:  d.count,
      total,
      rate:     total > 0 ? Math.round((d.count / total) * 100) : 0,
    };
  }).sort((a, b) => a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month);

  return successResponse(res, { data });
});

// @desc    Upgrade prompts — which features are locked for current plan
// @route   GET /api/analytics/upgrade-prompts
// @access  Private — Module 7 feature gating
const getUpgradePrompts = asyncHandler(async (req, res) => {
  const therapistId = req.user._id;

  // Features to check against the current plan
  const featureChecks = [
    { key: 'analytics_depth',    label: 'Advanced Analytics',    upgradeLabel: 'Unlock detailed revenue & session trends' },
    { key: 'pdf_exports',        label: 'PDF Exports',           upgradeLabel: 'Export invoices and notes as PDF' },
    { key: 'csv_exports',        label: 'CSV Exports',           upgradeLabel: 'Export data as CSV for reporting' },
    { key: 'recurring_sessions', label: 'Recurring Sessions',    upgradeLabel: 'Schedule auto-recurring weekly sessions' },
    { key: 'session_packages',   label: 'Session Packages',      upgradeLabel: 'Sell prepaid session bundles to clients' },
    { key: 'chat',               label: 'In-app Chat',           upgradeLabel: 'Chat directly with clients in-app' },
    { key: 'client_portal',      label: 'Client Portal',         upgradeLabel: 'Let clients view notes and book sessions' },
    { key: 'custom_branding',    label: 'Custom Branding',       upgradeLabel: 'Add your logo and brand colours' },
    { key: 'priority_support',   label: 'Priority Support',      upgradeLabel: 'Get faster responses from our team' },
  ];

  const results = await Promise.all(
    featureChecks.map(async (f) => {
      const access = await canAccess(therapistId, f.key);
      return { ...f, allowed: access.allowed, upgradeRequired: access.upgradeRequired };
    })
  );

  const locked   = results.filter((f) => !f.allowed);
  const unlocked = results.filter((f) =>  f.allowed);

  return successResponse(res, { locked, unlocked, plan: req.user.subscription?.plan || 'free' });
});

module.exports = {
  getSummary, getRevenueChart, getSessionChart,
  getClientChart, getTopClients, getNoShowChart, getUpgradePrompts,
};
