const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerValidators,
  loginValidators,
  updatePasswordValidators,
} = require('../validators/authValidators');

router.post('/register', registerValidators, validate, register);
router.post('/login',    loginValidators,    validate, login);
router.get('/me',        protect,                      getMe);
router.get('/refresh',   protect,                      refreshToken);
router.put('/password',  protect, updatePasswordValidators, validate, updatePassword);

module.exports = router;
