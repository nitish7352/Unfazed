const User = require('../models/User');
const TherapistProfile = require('../models/TherapistProfile');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Register a new therapist
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return errorResponse(res, 'Email already registered', 400);
  }

  const user = await User.create({ firstName, lastName, email, password, role: 'therapist' });

  // Create default therapist profile
  await TherapistProfile.create({
    user: user._id,
    workingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      enabled: day >= 1 && day <= 5, // Mon-Fri enabled by default
      start: '09:00',
      end: '17:00',
    })),
  });

  const token = generateToken(user._id, user.role);

  return successResponse(
    res,
    {
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        subscription: user.subscription,
      },
    },
    'Registration successful',
    201
  );
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Include password for comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  if (!user.isActive) {
    return errorResponse(res, 'Your account has been deactivated. Contact support.', 403);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);

  return successResponse(res, {
    token,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      subscription: user.subscription,
    },
  }, 'Login successful');
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return errorResponse(res, 'User not found', 404);

  return successResponse(res, { user });
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    return errorResponse(res, 'Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  return successResponse(res, {}, 'Password updated successfully');
});

// @desc    Refresh token
// @route   GET /api/auth/refresh
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
  const token = generateToken(req.user._id, req.user.role);
  return successResponse(res, { token }, 'Token refreshed');
});

module.exports = { register, login, getMe, updatePassword, refreshToken };
