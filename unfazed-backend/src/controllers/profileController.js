const User = require('../models/User');
const TherapistProfile = require('../models/TherapistProfile');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const path = require('path');
const fs = require('fs');

// @desc    Get therapist profile (own)
// @route   GET /api/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const profile = await TherapistProfile.findOne({ user: req.user._id }).populate(
    'user',
    'firstName lastName email phone avatar subscription notifications'
  );

  if (!profile) return errorResponse(res, 'Profile not found', 404);

  return successResponse(res, { profile });
});

// @desc    Update therapist profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedProfileFields = [
    'licenseNumber', 'licenseType', 'yearsExperience', 'specializations',
    'languages', 'bio', 'practiceName', 'practiceAddress', 'timezone',
    'currency', 'defaultSessionDuration', 'defaultSessionRate',
    'workingHours', 'website', 'linkedin',
  ];

  const allowedUserFields = ['firstName', 'lastName', 'phone', 'notifications'];

  const profileUpdates = {};
  const userUpdates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedProfileFields.includes(key)) profileUpdates[key] = req.body[key];
    if (allowedUserFields.includes(key))   userUpdates[key]    = req.body[key];
  });

  const [profile, user] = await Promise.all([
    TherapistProfile.findOneAndUpdate(
      { user: req.user._id },
      profileUpdates,
      { new: true, runValidators: true }
    ),
    Object.keys(userUpdates).length
      ? User.findByIdAndUpdate(req.user._id, userUpdates, { new: true })
      : User.findById(req.user._id),
  ]);

  if (!profile) return errorResponse(res, 'Profile not found', 404);

  const populated = await profile.populate('user', 'firstName lastName email phone avatar subscription notifications');
  return successResponse(res, { profile: populated }, 'Profile updated');
});

// @desc    Upload/update avatar
// @route   PUT /api/profile/avatar
// @access  Private
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return errorResponse(res, 'No file uploaded', 400);

  // Remove old avatar if exists
  const user = await User.findById(req.user._id);
  if (user.avatar) {
    const oldPath = path.join(__dirname, '../../', user.avatar);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user._id, { avatar: avatarPath });

  return successResponse(res, { avatar: avatarPath }, 'Avatar updated');
});

// @desc    Get public profile by user ID
// @route   GET /api/profile/:userId
// @access  Private
const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await TherapistProfile.findOne({ user: req.params.userId }).populate(
    'user',
    'firstName lastName email avatar'
  );
  if (!profile) return errorResponse(res, 'Profile not found', 404);
  return successResponse(res, { profile });
});

module.exports = { getProfile, updateProfile, updateAvatar, getPublicProfile };
