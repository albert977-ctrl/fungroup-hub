# Quick Start Guide - Fun Group Hub

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local and add your API credentials
```

### 3. Run Development Server
```bash
npm run dev
```

Server available at: `http://localhost:3000`

## API Testing

### Get All Messages (cURL)
```bash
curl http://localhost:3000/api/messages
```

### Get Email Thread
```bash
curl "http://localhost:3000/api/thread?id=THREAD_ID&channel=email"
```

### Get GHL Conversation
```bash
curl "http://localhost:3000/api/thread?id=CONVERSATION_ID&channel=ghl"
```

### Get SMS Thread
```bash
curl "http://localhost:3000/api/thread?id=MESSAGE_ID&channel=ringcentral&phoneNumber=%2B13055551234"
```

### Send Email Reply
```bash
curl -X POST http://localhost:3000/api/reply \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "EMAIL_MESSAGE_ID",
    "channel": "email",
    "brand": "werentfun",
    "to": "recipient@example.com",
    "body": "Thank you for your message!"
  }'
```

### Send GHL Reply
```bash
curl -X POST http://localhost:3000/api/reply \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "GHL_CONVERSATION_ID",
    "channel": "ghl",
    "locationId": "GHL_LOCATION_ID",
    "body": "Thanks for reaching out!"
  }'
```

### Send SMS
```bash
curl -X POST http://localhost:3000/api/reply \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "SMS_MESSAGE_ID",
    "channel": "ringcentral",
    "fromNumber": "+13055551234",
    "toNumber": "+13055555678",
    "body": "Thanks for the message!"
  }'
```

## Environment Variables Required

```
# Gmail OAuth2
GMAIL_CLIENT_ID=your_value
GMAIL_CLIENT_SECRET=your_value
GMAIL_REFRESH_TOKEN=your_value

# GoHighLevel API
GHL_API_KEY=your_value
GHL_LOCATION_WERENTFUN=your_value
GHL_LOCATION_JUSTBOUNCE=your_value
GHL_LOCATION_LASERTAG=your_value

# RingCentral OAuth2
RC_CLIENT_ID=your_value
RC_CLIENT_SECRET=your_value
RC_REFRESH_TOKEN=your_value
RC_SERVER_URL=https://platform.ringcentral.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
fungroup-hub/
├── app/api/               # Next.js API routes
│   ├── messages/         # GET unified messages
│   ├── reply/            # POST send replies
│   └── thread/           # GET conversation threads
├── lib/                  # Integration modules
│   ├── brands.js         # Brand config & detection
│   ├── gmail.js          # Gmail integration
│   ├── ghl.js            # GoHighLevel integration
│   └── ringcentral.js    # RingCentral integration
├── package.json          # Dependencies
├── next.config.js        # Next.js config
└── .env.example          # Env template
```

## Brands Configured

| ID | Name | Phone |
|----|------|-------|
| werentfun | We Rent Fun | 305-985-0505 |
| justbounce | Just Bounce Miami | 305-909-2686 |
| lasertag | Laser Tag Of Miami | 305-985-0505 |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Run linter
```

## Response Format

All API responses are JSON with consistent structure:

**Success**:
```json
{
  "messages": [...],
  "errors": [],
  "totalMessages": 10,
  "sources": { "gmail": 5, "ghl": 3, "ringcentral": 2 }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

## Common Issues

### 401 Unauthorized - Gmail
- Check `GMAIL_REFRESH_TOKEN` is valid
- Ensure Gmail OAuth2 credentials are correct

### 401 Unauthorized - GHL
- Check `GHL_API_KEY` is valid and has correct permissions

### 401 Unauthorized - RingCentral
- Check `RC_REFRESH_TOKEN` is not expired
- Verify `RC_CLIENT_ID` and `RC_CLIENT_SECRET`

### Port Already in Use
```bash
npm run dev -- -p 3001  # Use different port
```

## Documentation

- **README.md** - Full API documentation
- **IMPLEMENTATION.md** - Architecture and technical details
- **This file** - Quick start guide

## Support

For issues or questions:
1. Check environment variables are set correctly
2. Review console logs for detailed error messages
3. Verify API credentials are valid
4. Check external API status pages

## Production Deployment

```bash
npm run build
npm start
# API running on configured PORT (default 3000)
```

Set all environment variables in production environment before starting.
