/**
 * Notification Service
 * Creates and retrieves in-app notifications (deadline reminders, etc.)
 */

const Notification = require("../models/Notification");

class NotificationService {
  async create({ type = "info", title, body = null, noteId = null, link = null }) {
    return await Notification.create({
      type,
      title,
      body,
      noteId,
      link,
      read: false
    });
  }

  async getNotifications(options = {}) {
    const { unreadOnly = false, limit = 50 } = options;
    const where = {};
    if (unreadOnly) where.read = false;
    const list = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit
    });
    return list.map((n) => n.toJSON());
  }

  async markRead(id) {
    const n = await Notification.findByPk(id);
    if (!n) return null;
    await n.update({ read: true });
    return n.toJSON();
  }

  async markAllRead() {
    await Notification.update({ read: true }, { where: {} });
    return { message: "All notifications marked as read" };
  }

  async getUnreadCount() {
    const count = await Notification.count({ where: { read: false } });
    return count;
  }
}

module.exports = new NotificationService();
