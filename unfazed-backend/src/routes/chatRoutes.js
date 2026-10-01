const express = require('express');
const router  = express.Router();
const { getChatHistory, markRoomRead, getUnreadCounts } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/unread',        getUnreadCounts);   // GET /api/chat/unread
router.get('/:clientId',     getChatHistory);    // GET /api/chat/:clientId
router.put('/:clientId/read',markRoomRead);      // PUT /api/chat/:clientId/read

module.exports = router;
