/**
 * Creates a series of recurring sessions from a base session config.
 */
const Session = require('../models/Session');
const crypto  = require('crypto');

/**
 * @param {object} baseConfig - { therapist, client, startTime, duration, type, modality, rate, timezone }
 * @param {string} frequency  - 'weekly' | 'biweekly' | 'monthly'
 * @param {number} count      - how many occurrences to create (max 52)
 * @returns {Promise<Session[]>}
 */
const createRecurringSessions = async (baseConfig, frequency, count = 8) => {
  const maxCount   = Math.min(count, 52);
  const groupId    = crypto.randomBytes(8).toString('hex');
  const sessions   = [];
  const intervalMs = {
    weekly:    7 * 24 * 60 * 60 * 1000,
    biweekly: 14 * 24 * 60 * 60 * 1000,
    monthly:  30 * 24 * 60 * 60 * 1000,
  }[frequency] || 7 * 24 * 60 * 60 * 1000;

  let startTime = new Date(baseConfig.startTime);

  for (let i = 0; i < maxCount; i++) {
    const endTime = new Date(startTime.getTime() + baseConfig.duration * 60 * 1000);
    const roomId  = crypto.randomBytes(8).toString('hex');

    sessions.push({
      ...baseConfig,
      startTime,
      endTime,
      roomId,
      joinLink: `/session/room/${roomId}`,
      recurringGroupId: groupId,
      status: 'scheduled',
    });

    startTime = new Date(startTime.getTime() + intervalMs);
  }

  return Session.insertMany(sessions);
};

/**
 * Cancel all future sessions in a recurring group.
 * @param {string} groupId
 * @param {ObjectId} therapistId
 */
const cancelRecurringGroup = async (groupId, therapistId) => {
  return Session.updateMany(
    {
      recurringGroupId: groupId,
      therapist:        therapistId,
      startTime:        { $gt: new Date() },
      status:           { $in: ['scheduled', 'confirmed'] },
    },
    {
      status:      'cancelled',
      cancelledBy: 'therapist',
      cancelledAt: new Date(),
      cancellationReason: 'Recurring series cancelled',
    }
  );
};

module.exports = { createRecurringSessions, cancelRecurringGroup };
