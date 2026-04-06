/**
 * GET /api/messages
 * Fetches unified messages from all communication channels
 * Combines Gmail, GoHighLevel, and RingCentral messages
 * Handles individual API failures gracefully with detailed error reporting
 */

import { fetchEmails } from '@/lib/gmail';
import { fetchAllGHLMessages } from '@/lib/ghl';
import { fetchSMSMessages } from '@/lib/ringcentral';

/**
 * Fetch messages from all three communication channels
 * Uses Promise.allSettled to handle partial failures
 * @param {Request} request - HTTP request object
 * @returns {Response} JSON response with messages and errors
 */
export async function GET(request) {
  try {
    // Fetch from all three sources concurrently with error handling
    const results = await Promise.allSettled([
      fetchEmails(20),
      fetchAllGHLMessages(),
      fetchSMSMessages(20),
    ]);

    const messages = [];
    const errors = [];

    // Process Gmail results
    if (results[0].status === 'fulfilled') {
      messages.push(...results[0].value);
    } else {
      errors.push({
        source: 'gmail',
        error: results[0].reason?.message || 'Failed to fetch emails',
      });
    }

    // Process GHL results
    if (results[1].status === 'fulfilled') {
      messages.push(...results[1].value);
    } else {
      errors.push({
        source: 'ghl',
        error: results[1].reason?.message || 'Failed to fetch GHL conversations',
      });
    }

    // Process RingCentral results
    if (results[2].status === 'fulfilled') {
      messages.push(...results[2].value);
    } else {
      errors.push({
        source: 'ringcentral',
        error: results[2].reason?.message || 'Failed to fetch SMS messages',
      });
    }

    // Sort messages by timestamp (newest first)
    messages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return Response.json(
      {
        messages,
        errors,
        totalMessages: messages.length,
        sources: {
          gmail: results[0].status === 'fulfilled' ? results[0].value.length : 0,
          ghl: results[1].status === 'fulfilled' ? results[1].value.length : 0,
          ringcentral: results[2].status === 'fulfilled' ? results[2].value.length : 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/messages:', error);
    return Response.json(
      {
        messages: [],
        errors: [
          {
            source: 'internal',
            error: error.message || 'Internal server error',
          },
        ],
        totalMessages: 0,
      },
      { status: 500 }
    );
  }
}
