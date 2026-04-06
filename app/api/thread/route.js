/**
 * GET /api/thread?id=X&channel=Y
 * Fetches the full conversation thread from the appropriate channel
 * Supports email (Gmail), GHL conversations, and SMS conversations
 */

import { getThread as getGmailThread } from '@/lib/gmail';
import { getGHLThread } from '@/lib/ghl';
import { getSMSThread } from '@/lib/ringcentral';

/**
 * Fetch a full conversation thread
 * @param {Request} request - HTTP request with query parameters
 * @returns {Response} JSON response with thread messages
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const channel = searchParams.get('channel');
    const phoneNumber = searchParams.get('phoneNumber');

    // Validate required parameters
    if (!id || !channel) {
      return Response.json(
        {
          success: false,
          error: 'Missing required query parameters: id and channel',
        },
        { status: 400 }
      );
    }

    let messages = [];

    // Route to appropriate API based on channel
    switch (channel) {
      case 'email': {
        // For email, id is the thread ID
        messages = await getGmailThread(id);
        break;
      }

      case 'ghl': {
        // For GHL, id is the conversation ID
        messages = await getGHLThread(id);
        break;
      }

      case 'ringcentral': {
        // For SMS, we need the phone number to fetch the thread
        if (!phoneNumber) {
          return Response.json(
            {
              success: false,
              error: 'SMS threads require a phoneNumber query parameter',
            },
            { status: 400 }
          );
        }

        messages = await getSMSThread(phoneNumber);
        break;
      }

      default: {
        return Response.json(
          {
            success: false,
            error: `Unknown channel: ${channel}. Supported channels: email, ghl, ringcentral`,
          },
          { status: 400 }
        );
      }
    }

    return Response.json(
      {
        success: true,
        channel,
        id,
        messages,
        messageCount: messages.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/thread:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to fetch thread',
      },
      { status: 500 }
    );
  }
}
