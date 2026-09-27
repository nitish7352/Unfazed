const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a user.
 * @param {string} id - MongoDB user ObjectId
 * @param {string} role - User role (therapist | admin)
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
