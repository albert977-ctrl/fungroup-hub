# Implementation Guide - Fun Group Hub Backend API

This guide provides detailed information about the unified communications backend for The Fun Group Miami.

## Architecture Overview

The backend follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 App                          │
├─────────────────────────────────────────────────────────────┤
│  API Routes (/app/api/)                                    │
│  ├── GET  /messages     → Unified message feed             │
│  ├── POST /reply        → Send replies across channels     │
│  └── GET  /thread       → Get conversation threads         │
├─────────────────────────────────────────────────────────────┤
│  Integration Libraries (/lib/)                             │
│  ├── brands.js          → Brand config & detection         │
│  ├── gmail.js           → Gmail API wrapper                │
│  ├── ghl.js             → GoHighLevel API wrapper          │
│  └── ringcentral.js     → RingCentral API wrapper          │
├─────────────────────────────────────────────────────────────┤
│  External APIs                                             │
│  ├── Gmail API (googleapis)                                │
│  ├── GoHighLevel API (HTTP)                                │
│  └── RingCentral API (HTTP)                                │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Brand Configuration (`lib/brands.js`)

Manages brand metadata and detection logic.

**Key Functions**:
- `detectBrand(email)` - Identifies brand from email address
- `detectBrandByPhone(phoneNumber)` - Identifies brand from phone number
- `getAllBrandEmails()` - Returns all monitored email addresses
- `getBrandConfig(brandId)` - Gets brand configuration
- `getAllGHLLocationIds()` - Returns all GHL location IDs

**Brands**:
- `werentfun` - We Rent Fun (info@werentfun.net, al@werentfun.net)
- `justbounce` - Just Bounce Miami (info@justbouncemiami.com)
- `lasertag` - Laser Tag Of Miami (info@lasertagofmiami.com)

### 2. Gmail Integration (`lib/gmail.js`)

Handles email messaging through Google Gmail API.

**Key Functions**:
- `getGmailClient()` - Initializes OAuth2 client
- `fetchEmails(maxResults)` - Gets recent emails from inbox
- `sendReply(messageId, to, body, fromAlias)` - Sends email reply
- `getThread(threadId)` - Gets full email conversation

**Message Format**:
```javascript
{
  id: "message_id",
  threadId: "thread_id",
  brand: "werentfun",
  channel: "email",
  from: "Sender Name",
  email: "sender@example.com",
  subject: "Email Subject",
  preview: "First 150 chars of message...",
  time: "2 hours ago",
  timestamp: 1712345678000,
  unread: true,
  starred: false
}
```

**Implementation Details**:
- Uses OAuth2 with refresh token for authentication
- Automatically detects brand from sender email
- Extracts text content from plain/HTML emails
- Formats timestamps as relative time strings
- Handles email threading headers for proper replies

### 3. GoHighLevel Integration (`lib/ghl.js`)

Handles conversation messaging through GoHighLevel API.

**Key Functions**:
- `fetchGHLConversations(locationId)` - Gets conversations for a location
- `fetchAllGHLMessages()` - Gets all messages from all locations concurrently
- `sendGHLReply(conversationId, message, locationId)` - Sends GHL message
- `getGHLThread(conversationId)` - Gets full conversation

**Message Format**:
```javascript
{
  id: "conversation_id",
  brand: "justbounce",
  channel: "ghl",
  from: "Contact Name",
  subject: "SMS/Chat",
  preview: "Last message preview...",
  time: "1 day ago",
  timestamp: 1712123456000,
  unread: false,
  locationId: "ghl_location_id"
}
```

**Implementation Details**:
- Uses Bearer token authentication
- Fetches from all three locations concurrently (Promise.all)
- Detects brand based on GHL location ID
- Gets last message as preview
- Handles unread status tracking

### 4. RingCentral Integration (`lib/ringcentral.js`)

Handles SMS messaging through RingCentral API.

**Key Functions**:
- `getRCAuth()` - Gets/refreshes OAuth2 access token
- `fetchSMSMessages(maxResults)` - Gets recent SMS messages
- `sendSMS(fromNumber, toNumber, text)` - Sends SMS message
- `getSMSThread(phoneNumber)` - Gets SMS conversation with number

**Message Format**:
```javascript
{
  id: "message_id",
  brand: "werentfun",
  channel: "ringcentral",
  from: "+1305555555",
  toNumber: "+1305555666",
  subject: "SMS: +1305555555",
  preview: "Message text preview...",
  time: "Just now",
  timestamp: 1712345678000,
  unread: true,
  type: "sms"
}
```

**Implementation Details**:
- Manages OAuth2 token refresh automatically
- Caches tokens with expiry validation
- Filters message-store to SMS only
- Detects brand from inbound phone number
- Filters threads by normalized phone numbers

## API Route Implementations

### GET /api/messages

Aggregates messages from all three channels in a single request.

**Flow**:
1. Calls `Promise.allSettled()` to fetch from all sources concurrently
2. Handles individual failures gracefully
3. Merges all messages into single array
4. Sorts by timestamp (newest first)
5. Returns combined results with error tracking

**Error Handling**:
- If Gmail fails, GHL and RingCentral still return data
- Each failure logged in `errors` array with source
- Returns per-source message counts
- Overall endpoint returns 200 even if one source fails

**Response Fields**:
- `messages` - Array of normalized messages
- `errors` - Array of any channel failures
- `totalMessages` - Count of all messages
- `sources` - Breakdown of messages per channel

### POST /api/reply

Routes replies to appropriate channel based on message type.

**Routing Logic**:
```javascript
switch(channel) {
  case 'email':
    // Uses sendGmailReply with brand email as from address
  case 'ghl':
    // Uses sendGHLReply with conversation ID and location
  case 'ringcentral':
    // Uses sendSMS with phone numbers
}
```

**Request Validation**:
- `email`: Requires `to` field
- `ghl`: Requires `locationId` field
- `ringcentral`: Requires `fromNumber` and `toNumber` fields

**Response**:
```javascript
{
  success: true,
  channel: "email",
  message: "email message sent successfully",
  result: {
    id: "message_id",
    status: "sent"
  }
}
```

### GET /api/thread

Fetches full conversation thread from requested channel.

**Query Parameters**:
- `id` - Message/conversation/thread ID
- `channel` - Type of channel (email, ghl, ringcentral)
- `phoneNumber` - Required for SMS threads only

**Routing Logic**:
- `email`: Calls `getThread(id)` with thread ID
- `ghl`: Calls `getGHLThread(id)` with conversation ID
- `ringcentral`: Calls `getSMSThread(phoneNumber)` for SMS with number

**Response**:
```javascript
{
  success: true,
  channel: "email",
  id: "thread_id",
  messages: [
    {
      id: "message_id",
      from: "Sender",
      body: "Message content",
      time: "2 days ago",
      timestamp: 1712123456000
    }
  ],
  messageCount: 3
}
```

## Data Flow Examples

### Fetching All Messages

```
GET /api/messages
  ├── fetchEmails(20)
  │   ├── OAuth2 client setup
  │   ├── gmail.users.messages.list()
  │   ├── gmail.users.messages.get() x20 (parallel)
  │   └── Normalize to unified format
  │
  ├── fetchAllGHLMessages()
  │   ├── Loop through 3 locations (werentfun, justbounce, lasertag)
  │   ├── fetchGHLConversations(locationId) x3 (parallel)
  │   ├── Detect brand per location
  │   └── Normalize to unified format
  │
  └── fetchSMSMessages(20)
      ├── getRCAuth() (with token caching)
      ├── Get user extension ID
      ├── Message-store query (SMS only)
      ├── Detect brand by phone
      └── Normalize to unified format

Result: Merge + sort by timestamp → Response
```

### Sending a Reply

```
POST /api/reply
  ├── Parse request body
  ├── Validate required fields
  │
  ├── [if channel === 'email']
  │   ├── Get brand email alias
  │   ├── sendGmailReply(messageId, to, body, fromAlias)
  │   └── Return sent message details
  │
  ├── [if channel === 'ghl']
  │   ├── sendGHLReply(conversationId, message, locationId)
  │   └── Return sent message details
  │
  └── [if channel === 'ringcentral']
      ├── sendSMS(fromNumber, toNumber, text)
      └── Return sent message details

Result: Success response with channel and result
```

## Environment Variables

### Gmail
- `GMAIL_CLIENT_ID` - OAuth2 client ID from Google Cloud
- `GMAIL_CLIENT_SECRET` - OAuth2 client secret
- `GMAIL_REFRESH_TOKEN` - OAuth2 refresh token for persistent auth

### GoHighLevel
- `GHL_API_KEY` - API key from GHL dashboard
- `GHL_LOCATION_WERENTFUN` - We Rent Fun location ID
- `GHL_LOCATION_JUSTBOUNCE` - Just Bounce location ID
- `GHL_LOCATION_LASERTAG` - Laser Tag location ID

### RingCentral
- `RC_CLIENT_ID` - OAuth2 client ID
- `RC_CLIENT_SECRET` - OAuth2 client secret
- `RC_REFRESH_TOKEN` - OAuth2 refresh token
- `RC_SERVER_URL` - Base URL (default: https://platform.ringcentral.com)

### Application
- `NEXT_PUBLIC_APP_URL` - Public app URL for OAuth callbacks

## Error Handling Strategy

### At Integration Level
Each lib file includes try/catch blocks that:
1. Log error details to console
2. Throw error with descriptive message
3. Include context about which operation failed

### At API Route Level
Each route includes try/catch to:
1. Use `Promise.allSettled()` for concurrent operations
2. Treat failures as partial success if other channels work
3. Include errors array in response
4. Return appropriate HTTP status code

### Error Information
Returned errors include:
- `source` - Which channel/operation failed
- `error` - Error message for debugging
- `details` - Additional context when available

## Message Normalization

All messages normalized to common schema across channels:

```javascript
{
  id: string,           // Channel-specific unique ID
  brand: string,        // Detected brand: werentfun|justbounce|lasertag
  channel: string,      // Source: email|ghl|ringcentral
  from: string,         // Sender name or number
  subject: string,      // Email subject or channel source
  preview: string,      // Message preview (max 150 chars)
  time: string,         // Relative time: "2 hours ago"
  timestamp: number,    // Unix timestamp in milliseconds
  unread: boolean,      // Whether message is unread
  [channel-specific fields]
}
```

## Performance Considerations

1. **Concurrent Requests**: Uses `Promise.all()` and `Promise.allSettled()` for parallel channel fetching
2. **Token Caching**: RingCentral tokens cached with expiry validation
3. **Limit Results**: Default 20 messages per channel to minimize API load
4. **Error Resilience**: One failing channel doesn't block others
5. **Lazy Client Init**: Gmail client initialized on first use

## Security Considerations

1. **API Keys**: Stored in server-side environment variables only
2. **OAuth2**: Refresh tokens never exposed to client
3. **User Context**: All requests authenticated at external API level
4. **No Client Secrets**: Never sent to browser
5. **CORS**: Not configured (backend-only, no browser requests)

## Testing Checklist

- [ ] Test Gmail API connection and message fetching
- [ ] Test GHL API connection for all three locations
- [ ] Test RingCentral auth token refresh mechanism
- [ ] Test brand detection for each channel
- [ ] Test sending replies through each channel
- [ ] Test thread fetching from each channel
- [ ] Test partial failure scenarios (one channel down)
- [ ] Test error handling and response formats
- [ ] Load test message aggregation with max results
- [ ] Monitor API rate limits across all services

## Deployment Notes

1. Install production dependencies: `npm ci`
2. Build: `npm run build`
3. Set all environment variables in production
4. Start: `npm start`
5. Monitor logs for auth token refresh issues
6. Set up alerts for API failures

## Future Enhancements

- Add message search/filtering
- Add message pagination
- Add webhook support for real-time updates
- Add message archiving
- Add analytics on message traffic
- Add rate limiting
- Add request caching layer
- Add message attachments support
