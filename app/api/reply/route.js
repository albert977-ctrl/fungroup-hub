/**
 * POST /api/reply
 * Sends a reply to a message across all communication channels
 * Routes to the appropriate API based on the channel type
 */

import { sendReply as sendGmailReply } from '@/lib/gmail';
import { sendGHLReply } from '@/lib/ghl';
import { sendSMS } from '@/lib/ringcentral';
import { getBrandConfig } from '@/lib/brands';

/**
 * Send a reply to a message in the appropriate channel
 * @param {Request} request - HTTP request with POST body
 * @returns {Response} JSON response with send status
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { messageId, channel, brand, to, body: messageBody, fromNumber, toNumber, locationId } =
      body;

    // Validate required fields
    if (!messageId || !channel || !messageBody) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: messageId, channel, and body',
        },
        { status: 400 }
      );
    }

    let result = null;

    // Route to appropriate API based on channel
    switch (channel) {
      case 'email': {
        if (!to) {
          return Response.json(
            {
              success: false,
              error: 'Email replies require a "to" field',
            },
            { status: 400 }
          );
        }

        // Get brand email alias if not provided
        let fromAlias = to;
        if (brand) {
          const brandConfig = getBrandConfig(brand);
          if (brandConfig && brandConfig.emails.length > 0) {
            fromAlias = brandConfig.emails[0];
          }
        }

        result = await sendGmailReply(messageId, to, messageBody, fromAlias);
        break;
      }

      case 'ghl': {
        if (!locationId) {
          return Response.json(
            {
              success: false,
              error: 'GHL replies require a locationId',
            },
            { status: 400 }
          );
        }

        result = await sendGHLReply(messageId, messageBody, locationId);
        break;
      }

      case 'ringcentral': {
        if (!fromNumber || !toNumber) {
          return Response.json(
            {
              success: false,
              error: 'SMS replies require fromNumber and toNumber fields',
            },
            { status: 400 }
          );
        }

        result = await sendSMS(fromNumber, toNumber, messageBody);
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
        message: `${channel} message sent successfully`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/reply:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to send reply',
      },
      { status: 500 }
    );
  }
}
