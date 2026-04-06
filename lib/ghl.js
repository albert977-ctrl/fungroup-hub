/**
 * GoHighLevel integration module
 * Handles conversation fetching, sending, and thread management via GHL API
 */

import axios from 'axios';
import { detectBrand, getAllGHLLocationIds, getBrandConfig, getAllBrands } from './brands.js';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

/**
 * Map of brand IDs to their GHL API keys
 * Each sub-account has its own API key in GHL
 */
const GHL_KEYS = {
  werentfun: () => process.env.GHL_API_KEY_WERENTFUN,
  justbounce: () => process.env.GHL_API_KEY_JUSTBOUNCE,
  lasertag: () => process.env.GHL_API_KEY_LASERTAG,
};

/**
 * Create axios instance with GHL authentication for a specific brand
 * @param {string} brandId - Brand ID to get the correct API key
 * @returns {object} Axios instance with auth headers
 */
function getGHLClient(brandId = 'werentfun') {
  const apiKey = GHL_KEYS[brandId]?.() || process.env.GHL_API_KEY_WERENTFUN;
  if (!apiKey) {
    console.error(`[GHL] No API key found for brand: ${brandId}`);
  }
  return axios.create({
    baseURL: GHL_BASE_URL,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
  });
}

/**
 * Convert GHL timestamp to relative time string
 * @param {number|string} timestamp - Unix timestamp or ISO string
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
 * Detect brand from GHL location ID
 * Uses the imported getAllBrands() instead of require()
 * @param {string} locationId - GHL location ID
 * @returns {string} Brand ID or 'unknown'
 */
function detectBrandFromLocationId(locationId) {
  const brands = getAllBrands();
  for (const [brandId, brandConfig] of Object.entries(brands)) {
    if (brandConfig.ghlLocationId === locationId) {
      return brandId;
    }
  }
  return 'unknown';
}

/**
 * Fetch conversations from a specific GHL location
 * @param {string} locationId - GHL location ID
 * @param {string} brandId - Brand ID for API key selection
 * @returns {Promise<array>} Array of conversations
 */
export async function fetchGHLConversations(locationId, brandId = 'werentfun') {
  try {
    console.log(`[GHL] Fetching conversations for location=${locationId}, brand=${brandId}`);
    const client = getGHLClient(brandId);

    const response = await client.get('/conversations/search', {
      params: {
        locationId,
        limit: 20,
      },
    });

    const conversations = response.data.conversations || [];
    console.log(`[GHL] Found ${conversations.length} conversations for ${brandId}`);
    return conversations;
  } catch (error) {
    console.error(`[GHL] Error fetching conversations for location ${locationId} (brand: ${brandId}):`, error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch messages from all GHL locations concurrently
 * Normalizes to unified message format across all brands
 * @returns {Promise<array>} Array of normalized GHL messages
 */
export async function fetchAllGHLMessages() {
  try {
    const locationIds = getAllGHLLocationIds();
    console.log(`[GHL] Found ${locationIds.length} location IDs:`, locationIds);

    if (locationIds.length === 0) {
      console.warn('[GHL] No location IDs configured. Check GHL_LOCATION_* env vars.');
      return [];
    }

    // Fetch from all locations concurrently, detecting brand per location
    const conversationPromises = locationIds.map((locationId) => {
      const brand = detectBrandFromLocationId(locationId);
      console.log(`[GHL] Location ${locationId} -> brand: ${brand}`);
      return fetchGHLConversations(locationId, brand).then((conversations) => ({
        locationId,
        brand,
        conversations,
      }));
    });

    const results = await Promise.allSettled(conversationPromises);

    // Normalize messages from all locations
    const messages = [];

    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('[GHL] Location fetch failed:', result.reason?.message);
        return;
      }

      const { locationId, brand, conversations } = result.value;

      conversations.forEach((conversation) => {
        // Get latest message preview
        const messages_array = conversation.messages || [];
        const latestMessage =
          messages_array.length > 0 ? messages_array[messages_array.length - 1] : null;

        const preview = latestMessage
          ? (latestMessage.body || latestMessage.text || '(No preview)').substring(0, 150)
          : '(No messages)';

        const lastMessageTime = latestMessage
          ? latestMessage.createdAt || latestMessage.timestamp
          : conversation.lastMessageDate || Date.now();

        messages.push({
          id: conversation.id,
          brand,
          channel: 'ghl',
          from: conversation.contactName || conversation.contactPhone || 'Unknown',
          subject: conversation.source || 'GHL Conversation',
          preview,
          time: formatRelativeTime(lastMessageTime),
          timestamp:
            typeof lastMessageTime === 'string'
              ? new Date(lastMessageTime).getTime()
              : lastMessageTime * 1000,
          unread: conversation.unreadCount > 0,
          locationId,
        });
      });
    });

    return messages;
  } catch (error) {
    console.error('[GHL] Error fetching all GHL messages:', error);
    throw error;
  }
}

/**
 * Send a reply to a GHL conversation
 * @param {string} conversationId - GHL conversation ID
 * @param {string} message - Message text to send
 * @param {string} locationId - GHL location ID
 * @returns {Promise<object>} Sent message details
 */
export async function sendGHLReply(conversationId, message, locationId) {
  try {
    const brand = detectBrandFromLocationId(locationId);
    const client = getGHLClient(brand);

    const response = await client.post(`/conversations/${conversationId}/messages`, {
      body: message,
      locationId,
    });

    return {
      id: response.data.id,
      conversationId,
      status: 'sent',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[GHL] Error sending reply:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get full conversation thread from GHL
 * @param {string} conversationId - GHL conversation ID
 * @param {string} brandId - Brand ID for API key selection
 * @returns {Promise<array>} Array of messages in the conversation
 */
export async function getGHLThread(conversationId, brandId = 'werentfun') {
  try {
    const client = getGHLClient(brandId);

    const response = await client.get(`/conversations/${conversationId}`, {
      params: {
        includeMessages: true,
      },
    });

    const conversation = response.data.conversation || response.data;
    const messages_array = conversation.messages || [];

    return messages_array.map((message) => ({
      id: message.id,
      from: message.senderName || message.sender || 'Unknown',
      body: message.body || message.text || '',
      time: formatRelativeTime(message.createdAt || message.timestamp),
      timestamp:
        typeof message.createdAt === 'string'
          ? new Date(message.createdAt).getTime()
          : message.createdAt * 1000,
    }));
  } catch (error) {
    console.error('[GHL] Error fetching thread:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}
