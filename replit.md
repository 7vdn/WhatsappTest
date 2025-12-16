# WhatsApp Bot QR Authentication

## Overview
A simple web application for WhatsApp Bot authentication using the Baileys library. The app generates real QR codes that can be scanned with WhatsApp to connect a bot account, and provides an API for sending messages via n8n or other automation tools.

## Architecture

### Frontend (client/)
- **React** with TypeScript
- **Tailwind CSS** with Arabic RTL support (Cairo font)
- **WebSocket** for real-time communication with backend
- Single page app with connection state management

### Backend (server/)
- **Express.js** HTTP server
- **WebSocket** server on `/ws` path
- **Baileys** library for WhatsApp Web connection
- QR code generation using `qrcode` library
- REST API for sending messages

### Key Files
- `client/src/pages/Home.tsx` - Main UI component with QR display and connection states
- `server/whatsapp.ts` - Baileys WhatsApp connection manager
- `server/routes.ts` - WebSocket and API routes

## Features
- Real QR code generation using Baileys for WhatsApp authentication
- Real-time status updates via WebSocket
- Connection state management (disconnected, connecting, qr_ready, connected, error)
- Session persistence (auth credentials saved in `auth_info/` folder)
- Arabic RTL interface
- **API for sending messages** with access token authentication

## API Endpoints

### GET /api/status
Returns the current WhatsApp connection status.
```json
{ "connected": true, "status": "connected" }
```

### POST /api/send
Send a WhatsApp message. Requires authentication.

**Authentication** (one of the following):
- Header: `x-access-token: YOUR_TOKEN`
- Body parameter: `access_token`
- Query parameter: `?access_token=YOUR_TOKEN`

**Request Body (JSON or Form-Data):**
```json
{
  "number": "966501234567",
  "message": "Hello from API!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "ABC123",
  "message": "تم إرسال الرسالة بنجاح"
}
```

**Error Responses:**
- 401: Access token مطلوب
- 403: Access token غير صالح
- 503: WhatsApp غير متصل
- 400: number و message مطلوبين

## Connection Flow
1. User clicks "إضافة رقم" (Add Number) button
2. Backend creates Baileys WhatsApp socket
3. QR code is generated and sent to frontend via WebSocket
4. User scans QR with WhatsApp app
5. Connection established and access token displayed on frontend

## Technical Notes
- WebSocket path is `/ws` to avoid conflict with Vite HMR
- Auth credentials stored in `auth_info/` directory
- Access token stored in `access_token.json` (generated once, persisted)
- Connection guard prevents multiple concurrent Baileys sockets
- Auto-reconnect on connection drop (unless user logged out)
- Access token only visible in frontend after successful WhatsApp connection
