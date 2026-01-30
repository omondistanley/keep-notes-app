/**
 * Deadline Service
 * Handles deadline-related operations and reminders
 */

class DeadlineService {
  /**
   * Check for upcoming deadlines
   */
  async getUpcomingDeadlines(days = 7) {
    const dbService = require("./databaseService");
    const notes = await dbService.getNotes({});
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const upcoming = notes.filter(note => {
      const noteData = note.toJSON ? note.toJSON() : note;
      if (!noteData.deadline || !noteData.deadline.date) return false;
      const deadlineDate = new Date(noteData.deadline.date);
      return deadlineDate >= now && deadlineDate <= futureDate && 
             (!noteData.deadline.status || noteData.deadline.status === 'pending');
    });
    
    return upcoming.sort((a, b) => {
      const aData = a.toJSON ? a.toJSON() : a;
      const bData = b.toJSON ? b.toJSON() : b;
      return new Date(aData.deadline.date) - new Date(bData.deadline.date);
    });
  }

  /**
   * Get overdue notes
   */
  async getOverdueNotes() {
    const dbService = require("./databaseService");
    const notes = await dbService.getNotes({});
    
    const now = new Date();
    const overdue = notes.filter(note => {
      const noteData = note.toJSON ? note.toJSON() : note;
      if (!noteData.deadline || !noteData.deadline.date) return false;
      const deadlineDate = new Date(noteData.deadline.date);
      return deadlineDate < now && 
             (!noteData.deadline.status || noteData.deadline.status === 'pending');
    });
    
    // Auto-update status to overdue
    for (const note of overdue) {
      const noteData = note.toJSON ? note.toJSON() : note;
      if (noteData.deadline.status !== 'overdue') {
        await dbService.updateNote(noteData.id, {
          deadline: {
            ...noteData.deadline,
            status: 'overdue'
          }
        });
      }
    }
    
    return overdue.sort((a, b) => {
      const aData = a.toJSON ? a.toJSON() : a;
      const bData = b.toJSON ? b.toJSON() : b;
      return new Date(aData.deadline.date) - new Date(bData.deadline.date);
    });
  }

  /**
   * Send deadline reminder (mock implementation)
   */
  async sendReminder(note) {
    console.log(`[DEADLINE REMINDER] Note "${note.title}" - Deadline: ${note.deadline.date}`);
    // In production, this would send email/push notification
    return true;
  }
}

module.exports = new DeadlineService();

