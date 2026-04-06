/**
 * RingCentral integration module
 * Handles SMS fetching, sending, and thread management via RingCentral API
 */

import axios from 'axios';
import { detectBrandByPhone } from './brands.js';

let rcAccessToken = null;
let rcTokenExpiry = null;

const RC_SERVER_URL = process.env.RC_SERVER_URL || 'https://platform.ringcentral.com';

/**
 * Create axios instance with RingCentral authentication
 * @param {string} accessToken - OAuth access token
 * @returns {object} Axios instance with auth headers
 */
function getRCClient(accessToken) {
  return axios.create({
    baseURL: RC_SERVER_URL,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Get or refresh RingCentral access token
 * Uses refresh token to obtain new access token if expired
 * @returns {Promise<string>} Valid access token
 */
export async function getRCAuth() {
  // Return cached token if still valid
  if (rcAccessToken && rcTokenExpiry && rcTokenExpiry > Date.now() + 60000) {
    return rcAccessToken;
  }

  try {
    const response = await axios.post(`${RC_SERVER_URL}/restapi/oauth/token`, {
      grant_type: 'refresh_token',
      refresh_token: process.env.RC_REFRESH_TOKEN,
      client_id: process.env.RC_CLIENT_ID,
      client_secret: process.env.RC_CLIENT_SECRET,
    });

    rcAccessToken = response.data.access_token;
    rcTokenExpiry = Date.now() + (response.data.expires_in * 1000);

    return rcAccessToken;
  } catch (error) {
    console.error('Error getting RingCentral auth token:', error.message);
    throw error;
  }
}

/**
 * Convert RingCentral timestamp to relative time string
 * @param {string} timestamp - ISO timestamp or Unix timestamp
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

/**
 * Fetch SMS messages from RingCentral
 * @param {number} maxResults - Maximum number of messages to fetch
 * @returns {Promise<array>} Array of normalized SMS message objects
 */
export async function fetchSMSMessages(maxResults = 20) {
  try {
    const accessToken = await getRCAuth();
    const client = getRCClient(accessToken);

    // Get user info to access message store
    const userResponse = await client.get('/restapi/v1.0/account/~/extension/~');
    const extensionId = userResponse.data.id;

    // Fetch SMS messages
    const response = await client.get('/restapi/v1.0/account/~/extension/~/message-store', {
      params: {
        messageType: 'SMS',
        limit: maxResults,
        direction: 'Inbound',
      },
    });

    const messages = response.data.records || [];

    // Normalize messages
    return messages.map((message) => {
      const fromNumber = message.from?.phoneNumber || message.from || 'Unknown';
      const toNumber = message.to?.[0]?.phoneNumber || 'Unknown';
      const messageText = message.body || message.text || '';

      return {
        id: message.id,
        brand: detectBrandByPhone(toNumber),
        channel: 'ringcentral',
        from: fromNumber,
        toNumber,
        subject: `SMS: ${fromNumber}`,
        preview: messageText.substring(0, 150),
        time: formatRelativeTime(message.creationTime),
        timestamp: new Date(message.creationTime).getTime(),
        unread: message.readStatus === 'Unread',
        type: 'sms',
      };
    });
  } catch (error) {
    console.error('Error fetching RingCentral SMS messages:', error.message);
    throw error;
  }
}

/**
 * Send an SMS message via RingCentral
 * @param {string} fromNumber - Sender phone number
 * @param {string} toNumber - Recipient phone number
 * @param {string} text - Message text
 * @returns {Promise<object>} Sent message details
 */
export async function sendSMS(fromNumber, toNumber, text) {
  try {
    const accessToken = await getRCAuth();
    const client = getRCClient(accessToken);

    const response = await client.post('/restapi/v1.0/account/~/extension/~/sms', {
      from: {
        phoneNumber: fromNumber,
      },
      to: [
        {
          phoneNumber: toNumber,
        },
      ],
      text,
    });

    return {
      id: response.data.id,
      from: fromNumber,
      to: toNumber,
      status: 'sent',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw error;
  }
}

/**
 * Get SMS conversation thread with a specific phone number
 * @param {string} phoneNumber - Phone number to get thread with
 * @returns {Promise<array>} Array of messages in the conversation
 */
export async function getSMSThread(phoneNumber) {
  try {
    const accessToken = await getRCAuth();
    const client = getRCClient(accessToken);

    // Fetch messages from this phone number
    const response = await client.get('/restapi/v1.0/account/~/extension/~/message-store', {
      params: {
        messageType: 'SMS',
        limit: 50,
      },
    });

    const messages = response.data.records || [];

    // Filter to only messages from/to the specific phone number
    const threadMessages = messages
      .filter((msg) => {
        const msgFrom = msg.from?.phoneNumber || msg.from;
        const msgTo = msg.to?.[0]?.phoneNumber || msg.to;
        const normalizePhone = (phone) => phone.replace(/\D/g, '');
        const normalizedTargetPhone = normalizePhone(phoneNumber);

        return (
          normalizePhone(msgFrom) === normalizedTargetPhone ||
          normalizePhone(msgTo) === normalizedTargetPhone
        );
      })
      .sort((a, b) => new Date(a.creationTime) - new Date(b.creationTime));

    return threadMessages.map((message) => ({
      id: message.id,
      from: message.from?.phoneNumber || message.from,
      body: message.body || message.text || '',
      time: formatRelativeTime(message.creationTime),
      timestamp: new Date(message.creationTime).getTime(),
      direction: message.direction,
    }));
  } catch (error) {
    console.error('Error fetching RingCentral SMS thread:', error.message);
    throw error;
  }
}
