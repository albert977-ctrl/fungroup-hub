/**
 * Gmail integration module
 * Handles email fetching, sending, and thread management via Gmail API
 */

import { google } from 'googleapis';
import { detectBrand } from './brands.js';

let gmailClient = null;

/**
 * Initialize and return Gmail client with OAuth2 credentials
 * @returns {object} Gmail API client instance
 */
export function getGmailClient() {
  if (gmailClient) return gmailClient;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
  return gmailClient;
}

/**
 * Convert Gmail message to a relative time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

/**
 * Decode base64url strings used in Gmail API
 * @param {string} base64url - Base64url encoded string
 * @returns {string} Decoded string
 */
function decodeBase64Url(base64url) {
  try {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf8');
  } catch (error) {
    return '';
  }
}

/**
 * Extract email address from email header
 * @param {string} emailHeader - Email header value (e.g., "John Doe <john@example.com>")
 * @returns {string} Email address
 */
function extractEmail(emailHeader) {
  if (!emailHeader) return '';
  const match = emailHeader.match(/<([^>]+)>/);
  return match ? match[1] : emailHeader;
}

/**
 * Fetch recent emails from Gmail
 * @param {number} maxResults - Maximum number of emails to fetch
 * @returns {Promise<array>} Array of normalized message objects
 */
export async function fetchEmails(maxResults = 20) {
  try {
    const gmail = getGmailClient();

    // Fetch message list
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'in:inbox',
    });

    const messages = response.data.messages || [];

    // Fetch full details for each message
    const emailPromises = messages.map((msg) =>
      gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })
    );

    const fullMessages = await Promise.all(emailPromises);

    // Normalize and transform messages
    return fullMessages.map((message) => {
      const headers = message.data.payload.headers;
      const fromHeader = headers.find((h) => h.name === 'From')?.value || '';
      const subjectHeader = headers.find((h) => h.name === 'Subject')?.value || '(No subject)';
      const dateHeader = headers.find((h) => h.name === 'Date')?.value || '';

      const email = extractEmail(fromHeader);
      const name = fromHeader.replace(/<.*>/, '').trim() || email;

      // Get preview text
      let preview = '';
      if (message.data.snippet) {
        preview = message.data.snippet;
      } else if (message.data.payload.parts) {
        const textPart = message.data.payload.parts.find(
          (part) => part.mimeType === 'text/plain'
        );
        if (textPart && textPart.body.data) {
          preview = decodeBase64Url(textPart.body.data).substring(0, 100);
        }
      }

      const isUnread = message.data.labelIds?.includes('UNREAD') || false;
      const isStarred = message.data.labelIds?.includes('STARRED') || false;

      return {
        id: message.data.id,
        threadId: message.data.threadId,
        brand: detectBrand(email),
        channel: 'email',
        from: name,
        email,
        subject: subjectHeader,
        preview: preview.substring(0, 150),
        time: formatRelativeTime(new Date(dateHeader).getTime()),
        timestamp: new Date(dateHeader).getTime(),
        unread: isUnread,
        starred: isStarred,
      };
    });
  } catch (error) {
    console.error('Error fetching Gmail emails:', error);
    throw error;
  }
}

/**
 * Send a reply to an email message
 * @param {string} messageId - Gmail message ID to reply to
 * @param {string} to - Recipient email address
 * @param {string} body - Email body text
 * @param {string} fromAlias - Sender email alias (brand email)
 * @returns {Promise<object>} Sent message details
 */
export async function sendReply(messageId, to, body, fromAlias) {
  try {
    const gmail = getGmailClient();

    // Get the original message to get the subject and message ID for threading
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const headers = originalMessage.data.payload.headers;
    const subject = headers.find((h) => h.name === 'Subject')?.value || '';
    const messageIdHeader = headers.find((h) => h.name === 'Message-ID')?.value || '';

    // Create reply with proper threading headers
    const emailContent = [
      `From: ${fromAlias}`,
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      `In-Reply-To: ${messageIdHeader}`,
      `References: ${messageIdHeader}`,
      '',
      body,
    ].join('\r\n');

    const base64Email = Buffer.from(emailContent).toString('base64');

    const sent = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: base64Email,
        threadId: originalMessage.data.threadId,
      },
    });

    return {
      id: sent.data.id,
      threadId: sent.data.threadId,
      status: 'sent',
    };
  } catch (error) {
    console.error('Error sending Gmail reply:', error);
    throw error;
  }
}

/**
 * Get full conversation thread from Gmail
 * @param {string} threadId - Gmail thread ID
 * @returns {Promise<array>} Array of messages in the thread
 */
export async function getThread(threadId) {
  try {
    const gmail = getGmailClient();

    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });

    const messages = response.data.messages || [];

    return messages.map((message) => {
      const headers = message.payload.headers;
      const fromHeader = headers.find((h) => h.name === 'From')?.value || '';
      const subjectHeader = headers.find((h) => h.name === 'Subject')?.value || '';
      const dateHeader = headers.find((h) => h.name === 'Date')?.value || '';

      const email = extractEmail(fromHeader);
      const name = fromHeader.replace(/<.*>/, '').trim() || email;

      // Get body text
      let body = '';
      if (message.payload.parts) {
        const textPart = message.payload.parts.find(
          (part) => part.mimeType === 'text/plain'
        );
        if (textPart && textPart.body.data) {
          body = decodeBase64Url(textPart.body.data);
        }
      } else if (message.payload.body.data) {
        body = decodeBase64Url(message.payload.body.data);
      }

      return {
        id: message.id,
        from: name,
        email,
        subject: subjectHeader,
        body: body.substring(0, 500),
        time: formatRelativeTime(new Date(dateHeader).getTime()),
        timestamp: new Date(dateHeader).getTime(),
      };
    });
  } catch (error) {
    console.error('Error fetching Gmail thread:', error);
    throw error;
  }
}
