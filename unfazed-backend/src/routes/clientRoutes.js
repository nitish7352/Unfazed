const express = require('express');
const router = express.Router();
const {
  getClients, getClient, getMyClient, createClient, updateClient,
  deleteClient, updateIntakeForm, getClientSessions,
} = require('../controllers/clientController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my', getMyClient);
router.route('/').get(getClients).post(createClient);
router.route('/:id').get(getClient).put(updateClient).delete(deleteClient);
router.put('/:id/intake', updateIntakeForm);
router.get('/:id/sessions', getClientSessions);

module.exports = router;
