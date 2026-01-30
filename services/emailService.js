/**
 * Email Service (Mocked)
 * Handles email parsing and email-to-note conversion
 */

class EmailService {
  /**
   * Parse email content
   */
  parseEmail(emailData) {
    return {
      from: emailData.from || "sender@example.com",
      to: emailData.to || "recipient@example.com",
      subject: emailData.subject || "Email Subject",
      body: emailData.body || emailData.text || emailData.html || "",
      date: emailData.date || new Date(),
      attachments: emailData.attachments || []
    };
  }

  /**
   * Convert email to note
   */
  emailToNote(emailData) {
    const parsed = this.parseEmail(emailData);
    
    return {
      title: `Email: ${parsed.subject}`,
      content: `From: ${parsed.from}\nDate: ${parsed.date}\n\n${parsed.body}`,
      tags: ["email"],
      createdAt: parsed.date
    };
  }

  /**
   * Fetch emails (mocked)
   */
  async fetchEmails(query) {
    return [
      {
        from: "sender@example.com",
        subject: "Important Update",
        body: "This is an important email message.",
        date: new Date()
      }
    ];
  }
}

module.exports = new EmailService();

