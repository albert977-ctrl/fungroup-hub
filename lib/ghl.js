    if (brandConfig.ghlLocationId === locationId) {
      return brandId;
    }
  }
  return 'unknown';
}

/**
 * Fetch conversations from a specific GHL location
 * @param {string} locationId - GHL location ID
 * @returns {Promise<array>} Array of conversations
 */
export async function fetchGHLConversations(locationId) {
  try {
    const client = getGHLClient();

    const response = await client.get('/conversations/search', {
      params: {
        locationId,
        limit: 20,
      },
    });

    return response.data.conversations || [];
  } catch (error) {
    console.error(`Error fetching GHL conversations for location ${locationId}:`, error.message);
    throw error;
  }
}

/**
 * Fetch messages from all three GHL locations concurrently
 * Normalizes to unified message format across all brands
 * @returns {Promise<array>} Array of normalized GHL messages
 */
export async function fetchAllGHLMessages() {
  try {
    const locationIds = getAllGHLLocationIds();

    // Fetch from all locations concurrently
    const conversationPromises = locationIds.map((locationId) =>
      fetchGHLConversations(locationId).then((conversations) => ({
        locationId,
        conversations,
      }))
    );

    const results = await Promise.all(conversationPromises);

    // Normalize messages from all locations
    const messages = [];

    results.forEach(({ locationId, conversations }) => {
      const brand = detectBrandFromLocationId(locationId);

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
    console.error('Error fetching all GHL messages:', error);
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
    const client = getGHLClient();

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
    console.error('Error sending GHL reply:', error.message);
    throw error;
  }
}

/**
 * Get full conversation thread from GHL
 * @param {string} conversationId - GHL conversation ID
 * @returns {Promise<array>} Array of messages in the conversation
 */
export async function getGHLThread(conversationId) {
  try {
    const client = getGHLClient();

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
    console.error('Error fetching GHL thread:', error.message);
    throw error;
  }
}
