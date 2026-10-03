const User = require('../models/User');
const TherapistProfile = require('../models/TherapistProfile');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { parseISO, startOfDay, endOfDay } = require('date-fns');

// @desc    Get all active public therapists with search & filters
// @route   GET /api/therapists
// @access  Public
const getPublicTherapists = asyncHandler(async (req, res) => {
  const {
    search,
    specialization,
    sessionType,
    mode,
    language,
    minPrice,
    maxPrice,
    day,
  } = req.query;

  // Find all active therapists
  const userQuery = { role: 'therapist', isActive: true };
  if (search) {
    const sRegex = new RegExp(search, 'i');
    userQuery.$or = [
      { firstName: sRegex },
      { lastName: sRegex },
    ];
  }

  const activeUsers = await User.find(userQuery).select('firstName lastName email avatar phone');
  const userIds = activeUsers.map((u) => u._id);

  // Profile query
  const profileQuery = {
    user: { $in: userIds },
    isPublic: { $ne: false },
    isApproved: { $ne: false },
  };

  if (specialization) {
    profileQuery.specializations = { $regex: new RegExp(specialization, 'i') };
  }
  if (sessionType) {
    profileQuery.sessionTypes = sessionType;
  }
  if (mode) {
    profileQuery.modes = mode;
  }
  if (language) {
    profileQuery.languages = { $regex: new RegExp(language, 'i') };
  }
  if (minPrice || maxPrice) {
    profileQuery.defaultSessionRate = {};
    if (minPrice) profileQuery.defaultSessionRate.$gte = Number(minPrice);
    if (maxPrice) profileQuery.defaultSessionRate.$lte = Number(maxPrice);
  }
  if (day !== undefined && day !== '') {
    profileQuery.workingHours = {
      $elemMatch: { day: Number(day), enabled: true },
    };
  }

  const profiles = await TherapistProfile.find(profileQuery).populate(
    'user',
    'firstName lastName email avatar phone'
  );

  // Map to public view
  const userMap = new Map(activeUsers.map((u) => [u._id.toString(), u]));

  const therapists = profiles
    .filter((p) => p.user && p.user._id)
    .map((p) => {
      const u = p.user;
      return {
        _id: u._id, // use User ID for booking & route consistency
        profileId: p._id,
        name: `Dr. ${u.firstName} ${u.lastName}`,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        avatar: u.avatar,
        phone: u.phone,
        title: p.title || 'Licensed Clinical Psychologist',
        qualification: p.qualification || 'M.Phil Clinical Psychology',
        licenseNumber: p.licenseNumber,
        licenseType: p.licenseType,
        yearsExperience: p.yearsExperience || 1,
        specializations: p.specializations?.length ? p.specializations : ['General Therapy', 'Anxiety', 'Stress'],
        languages: p.languages?.length ? p.languages : ['English', 'Hindi'],
        bio: p.bio || 'Compassionate and evidence-based clinical therapy helping you navigate stress, anxiety, and personal growth.',
        practiceName: p.practiceName,
        practiceAddress: p.practiceAddress,
        city: p.practiceAddress?.city || 'Delhi / NCR',
        state: p.practiceAddress?.state || 'Delhi',
        sessionFee: p.defaultSessionRate || 1200,
        defaultSessionDuration: p.defaultSessionDuration || 50,
        sessionTypes: p.sessionTypes?.length ? p.sessionTypes : ['individual', 'couples'],
        modes: p.modes?.length ? p.modes : ['online', 'in_person'],
        rating: p.rating || 5.0,
        reviewCount: p.reviewCount || 12,
        workingHours: p.workingHours,
        totalSessions: p.totalSessions || 0,
      };
    });

  return successResponse(res, { therapists, count: therapists.length });
});

// @desc    Get single public therapist profile by user ID or profile ID
// @route   GET /api/therapists/:id
// @access  Public
const getPublicTherapistById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let profile = await TherapistProfile.findOne({
    $or: [{ user: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  }).populate('user', 'firstName lastName email avatar phone isActive');

  if (!profile || !profile.user || !profile.user.isActive) {
    return errorResponse(res, 'Therapist profile not found or inactive', 404);
  }

  const u = profile.user;
  const therapistData = {
    _id: u._id,
    profileId: profile._id,
    name: `Dr. ${u.firstName} ${u.lastName}`,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    avatar: u.avatar,
    phone: u.phone,
    title: profile.title || 'Licensed Clinical Psychologist',
    qualification: profile.qualification || 'M.Phil Clinical Psychology',
    licenseNumber: profile.licenseNumber,
    licenseType: profile.licenseType,
    yearsExperience: profile.yearsExperience || 1,
    specializations: profile.specializations?.length ? profile.specializations : ['General Therapy', 'Anxiety', 'Stress'],
    languages: profile.languages?.length ? profile.languages : ['English', 'Hindi'],
    bio: profile.bio || 'Compassionate and evidence-based clinical therapy helping you navigate stress, anxiety, and personal growth.',
    practiceName: profile.practiceName,
    practiceAddress: profile.practiceAddress,
    city: profile.practiceAddress?.city || 'Delhi / NCR',
    state: profile.practiceAddress?.state || 'Delhi',
    sessionFee: profile.defaultSessionRate || 1200,
    defaultSessionDuration: profile.defaultSessionDuration || 50,
    sessionTypes: profile.sessionTypes?.length ? profile.sessionTypes : ['individual', 'couples'],
    modes: profile.modes?.length ? profile.modes : ['online', 'in_person'],
    rating: profile.rating || 5.0,
    reviewCount: profile.reviewCount || 12,
    workingHours: profile.workingHours,
    totalSessions: profile.totalSessions || 0,
    totalClients: profile.totalClients || 0,
  };

  return successResponse(res, { therapist: therapistData });
});

// @desc    Get therapist available slots for a given date
// @route   GET /api/therapists/:id/slots
// @access  Public
const getTherapistSlots = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, duration = 50, timezone = 'Asia/Kolkata' } = req.query;

  if (!date) {
    return errorResponse(res, 'date query parameter required (YYYY-MM-DD)', 400);
  }

  // Find user / availability
  const user = await User.findById(id);
  if (!user || user.role !== 'therapist') {
    return errorResponse(res, 'Therapist not found', 404);
  }

  let avail = await Availability.findOne({ therapist: id });
  if (!avail) {
    // Check if therapist has workingHours in profile
    const profile = await TherapistProfile.findOne({ user: id });
    const weeklySlots = (profile?.workingHours?.length ? profile.workingHours : [0, 1, 2, 3, 4, 5, 6]).map((w) => ({
      day: w.day !== undefined ? w.day : w,
      enabled: w.enabled !== undefined ? w.enabled : (w >= 1 && w <= 5),
      slots: (w.enabled || (w >= 1 && w <= 5)) ? [{ start: w.start || '09:00', end: w.end || '17:00' }] : [],
    }));

    avail = await Availability.create({
      therapist: id,
      weekly: weeklySlots,
      bufferTime: 10,
      defaultDuration: profile?.defaultSessionDuration || 50,
    });
  }

  const d = parseISO(date);
  const dayOfWeek = d.getDay();
  const dayConfig = avail.weekly.find((w) => w.day === dayOfWeek);

  if (!dayConfig || !dayConfig.enabled || !dayConfig.slots?.length) {
    return successResponse(res, { slots: [], reason: 'Not a working day for therapist' });
  }

  // Check for override (blocked day)
  const override = avail.overrides?.find((o) => {
    const od = new Date(o.date);
    return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth() && od.getDate() === d.getDate();
  });
  if (override?.isBlocked) {
    return successResponse(res, { slots: [], reason: 'Day blocked by therapist' });
  }

  const slotDuration = Number(duration);
  const buffer = avail.bufferTime || 10;
  const dayStart = startOfDay(d);
  const dayEnd = endOfDay(d);

  // Get booked sessions & active bookings
  const [bookedSessions, bookedBookings] = await Promise.all([
    Session.find({
      therapist: id,
      startTime: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled', 'no_show'] },
    }).select('startTime endTime'),
    Booking.find({
      therapist: id,
      startTime: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled', 'rejected'] },
    }).select('startTime endTime'),
  ]);

  const allBooked = [...bookedSessions, ...bookedBookings];

  const slots = [];
  for (const slot of dayConfig.slots) {
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    let current = new Date(d);
    current.setHours(sh, sm, 0, 0);
    const end = new Date(d);
    end.setHours(eh, em, 0, 0);

    while (current.getTime() + slotDuration * 60000 <= end.getTime()) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);
      const overlap = allBooked.some(
        (b) => current < new Date(b.endTime) && slotEnd > new Date(b.startTime)
      );

      if (!overlap) {
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
          timeLabel: current.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          available: true,
        });
      }
      current = new Date(current.getTime() + (slotDuration + buffer) * 60000);
    }
  }

  return successResponse(res, { slots, date, duration: slotDuration, timezone });
});

// @desc    Get therapist public availability summary
// @route   GET /api/therapists/:id/availability
// @access  Public
const getTherapistAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let avail = await Availability.findOne({ therapist: id }).select('-overrides');

  if (!avail) {
    const profile = await TherapistProfile.findOne({ user: id });
    if (!profile) return errorResponse(res, 'Therapist not found', 404);

    return successResponse(res, {
      availability: {
        workingHours: profile.workingHours,
        sessionDurations: [30, 45, 50, 60],
        defaultDuration: profile.defaultSessionDuration || 50,
      },
    });
  }

  return successResponse(res, { availability: avail });
});

module.exports = {
  getPublicTherapists,
  getPublicTherapistById,
  getTherapistSlots,
  getTherapistAvailability,
};
