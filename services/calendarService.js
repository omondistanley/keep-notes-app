/**
 * Calendar Service (Mocked)
 * Handles Google Calendar and Outlook integration
 */

class CalendarService {
  /**
   * Generate mock calendar events
   */
  generateMockEvents(count = 5) {
    const events = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const startDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      
      events.push({
        id: `event_${i}`,
        summary: `Meeting ${i + 1}`,
        description: `Meeting description ${i + 1}`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: "UTC"
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: "UTC"
        },
        location: `Location ${i + 1}`,
        attendees: [`attendee${i}@example.com`]
      });
    }
    
    return events;
  }

  /**
   * Get calendar events
   */
  async getEvents(timeMin, timeMax) {
    return this.generateMockEvents(10);
  }

  /**
   * Create calendar event from note
   */
  async createEventFromNote(note) {
    if (!note.deadline || !note.deadline.date) {
      throw new Error("Note must have a deadline to create calendar event");
    }
    
    return {
      id: `event_${Date.now()}`,
      summary: note.title,
      description: note.content,
      start: {
        dateTime: new Date(note.deadline.date).toISOString(),
        timeZone: note.deadline.timezone || "UTC"
      },
      end: {
        dateTime: new Date(new Date(note.deadline.date).getTime() + 3600000).toISOString(),
        timeZone: note.deadline.timezone || "UTC"
      }
    };
  }
}

module.exports = new CalendarService();

