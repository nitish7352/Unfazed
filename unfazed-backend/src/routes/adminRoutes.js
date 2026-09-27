const express  = require('express');
const router   = express.Router();
const { getUsers, getUser, updateUser, getPlatformStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats',         getPlatformStats);
router.get('/users',         getUsers);
router.route('/users/:id').get(getUser).put(updateUser);

module.exports = router;
