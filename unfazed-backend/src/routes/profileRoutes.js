const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateAvatar, getPublicProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/multer');

router.get('/',          protect, getProfile);
router.put('/',          protect, updateProfile);
router.put('/avatar',    protect, uploadAvatar.single('avatar'), updateAvatar);
router.get('/:userId',   protect, getPublicProfile);

module.exports = router;
