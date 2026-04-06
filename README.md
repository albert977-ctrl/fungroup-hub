# Fun Group Hub - Unified Communications Dashboard

A Next.js 14 backend API for managing unified communications across multiple channels (Gmail, GoHighLevel, RingCentral) for The Fun Group Miami (Omega Events LLC).

## Overview

This project provides a complete backend API for aggregating messages from three communication channels:
- **Gmail**: Email messages from brand accounts
- **GoHighLevel (GHL)**: Conversations from three location-based accounts
- **RingCentral**: SMS messages

All messages are normalized to a unified format, sorted chronologically, and served through REST API endpoints.

## Project Structure

```
fungroup-hub/
├── app/
│   └── api/
│       ├── messages/route.js      # GET unified messages from all channels
│       ├── reply/route.js         # POST reply to messages
│       └── thread/route.js        # GET full conversation threads
├── lib/
│   ├── brands.js                  # Brand configuration and detection
│   ├── gmail.js                   # Gmail API integration
│   ├── ghl.js                     # GoHighLevel API integration
│   └── ringcentral.js             # RingCentral API integration
├── package.json                   # Dependencies and scripts
├── next.config.js                 # Next.js configuration
├── .env.example                   # Environment variables template
└── README.md                       # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- **Gmail**: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- **GoHighLevel**: `GHL_API_KEY`, `GHL_LOCATION_WERENTFUN`, `GHL_LOCATION_JUSTBOUNCE`, `GHL_LOCATION_LASERTAG`
- **RingCentral**: `RC_CLIENT_ID`, `RC_CLIENT_SECRET`, `RC_REFRESH_TOKEN`, `RC_SERVER_URL`
- **App**: `NEXT_PUBLIC_APP_URL`

### 3. Run Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Brands Configuration

Three brands are configured in `lib/brands.js`:

| Brand | Name | Color | Phone | Emails |
|-------|------|-------|-------|--------|
| werentfun | We Rent Fun | Purple (#8b5cf6) | 305-985-0505 | info@werentfun.net, al@werentfun.net |
| justbounce | Just Bounce Miami | Cyan (#06b6d4) | 305-909-2686 | info@justbouncemiami.com |
| lasertag | Laser Tag Of Miami | Amber (#f59e0b) | 305-985-0505 | info@lasertagofmiami.com |

## API Endpoints

### GET /api/messages

Fetches unified messages from all communication channels.

**Query Parameters**: None

**Response**:
```json
{
  "messages": [
    {
      "id": "message_id",
      "threadId": "thread_id",
      "brand": "werentfun",
      "channel": "email",
      "from": "John Doe",
      "email": "john@example.com",
      "subject": "Project Update",
      "preview": "Here's the latest status...",
      "time": "2 hours ago",
      "timestamp": 1712345678000,
      "unread": true,
      "starred": false
    }
  ],
  "errors": [],
  "totalMessages": 42,
  "sources": {
    "gmail": 15,
    "ghl": 20,
    "ringcentral": 7
  }
}
```

**Error Handling**: If one channel fails, others still return data. Failed channels are listed in the `errors` array.

### POST /api/reply

Sends a reply to a message in the appropriate channel.

**Request Body** (email):
```json
{
  "messageId": "gmail_message_id",
  "channel": "email",
  "brand": "werentfun",
  "to": "recipient@example.com",
  "body": "Thank you for reaching out..."
}
```

**Request Body** (GHL):
```json
{
  "messageId": "ghl_conversation_id",
  "channel": "ghl",
  "locationId": "ghl_location_id",
  "body": "Thanks for contacting us!"
}
```

**Request Body** (SMS):
```json
{
  "messageId": "sms_message_id",
  "channel": "ringcentral",
  "fromNumber": "+13055555555",
  "toNumber": "+13051234567",
  "body": "Thanks for the message!"
}
```

**Response**:
```json
{
  "success": true,
  "channel": "email",
  "message": "email message sent successfully",
  "result": {
    "id": "message_id",
    "threadId": "thread_id",
    "status": "sent"
  }
}
```

### GET /api/thread

Fetches the full conversation thread.

**Query Parameters**:
- `id` (required): Message/conversation/thread ID
- `channel` (required): Channel type (`email`, `ghl`, `ringcentral`)
- `phoneNumber` (required for SMS): Phone number for SMS threads

**Response**:
```json
{
  "success": true,
  "channel": "email",
  "id": "thread_id",
  "messages": [
    {
      "id": "message_id",
      "from": "John Doe",
      "email": "john@example.com",
      "subject": "Original Subject",
      "body": "Full message body text...",
      "time": "3 days ago",
      "timestamp": 1712123456000
    }
  ],
  "messageCount": 5
}
```

## Authentication

### Gmail OAuth2

Uses OAuth2 with refresh token. Credentials must be obtained from Google Cloud Console:
1. Create OAuth2 credentials (Desktop app type)
2. Obtain refresh token through OAuth flow
3. Store in environment variables

### GoHighLevel API Key

API key obtained from GoHighLevel dashboard. Used for all GHL requests.

### RingCentral OAuth2

Uses OAuth2 with refresh token. Credentials obtained from RingCentral Developer Console.

## Brand Detection

Messages automatically detect their brand based on:
- **Email**: Email address domain/account
- **GHL**: Location ID mapping
- **SMS**: Phone number matching

## Error Handling

All API routes include comprehensive error handling:
- Individual channel failures don't block other channels
- Errors include source and error message
- HTTP status codes indicate overall response status
- Detailed console logging for debugging

## Development Notes

- Uses ES6 modules throughout (import/export)
- CommonJS used only where necessary
- Production-ready error handling
- All integrations use axios and googleapis libraries
- Message timestamps normalized to milliseconds
- Relative time formatting ("2 hours ago") in responses

## Production Build

```bash
npm run build
npm run start
```

## License

Proprietary - The Fun Group Miami / Omega Events LLC
