import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import pino from "pino";
import { WebSocket as WsWebSocket } from "ws";
import * as fs from "fs";

const AUTH_FOLDER = "./auth_info";

interface WhatsAppClient {
  socket: WASocket | null;
  isConnected: boolean;
  isConnecting: boolean;
}

const client: WhatsAppClient = {
  socket: null,
  isConnected: false,
  isConnecting: false,
};

const connectedClients: Set<WsWebSocket> = new Set();

export function addClient(ws: WsWebSocket) {
  connectedClients.add(ws);
  if (client.isConnected && client.socket) {
    const phoneNumber = client.socket.user?.id?.split(":")[0] || "";
    sendToClient(ws, { type: "connected", phoneNumber });
  } else {
    sendToClient(ws, { type: "disconnected" });
  }
}

export function removeClient(ws: WsWebSocket) {
  connectedClients.delete(ws);
}

function broadcast(data: object) {
  const message = JSON.stringify(data);
  connectedClients.forEach((ws) => {
    if (ws.readyState === WsWebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function sendToClient(ws: WsWebSocket, data: object) {
  if (ws.readyState === WsWebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

async function cleanupExistingConnection() {
  if (client.socket) {
    try {
      client.socket.ev.removeAllListeners("creds.update");
      client.socket.ev.removeAllListeners("connection.update");
      client.socket.ev.removeAllListeners("messages.upsert");
      client.socket.end(undefined);
    } catch (err) {
      console.error("Error cleaning up socket:", err);
    }
    client.socket = null;
  }
}

export async function startWhatsAppConnection() {
  if (client.isConnecting) {
    console.log("Connection already in progress, ignoring start request");
    return;
  }

  if (client.isConnected && client.socket) {
    console.log("Already connected, ignoring start request");
    const phoneNumber = client.socket.user?.id?.split(":")[0] || "";
    broadcast({ type: "connected", phoneNumber });
    return;
  }

  try {
    client.isConnecting = true;
    await cleanupExistingConnection();
    broadcast({ type: "connecting" });

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    const logger = pino({ level: "silent" });

    const socket = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ["WhatsApp Bot", "Chrome", "1.0.0"],
    });

    client.socket = socket;

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });
          broadcast({ type: "qr", qr: qrDataUrl });
        } catch (err) {
          console.error("Failed to generate QR code:", err);
          broadcast({ type: "error", message: "فشل في إنشاء رمز QR" });
        }
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        client.isConnected = false;
        client.isConnecting = false;

        if (shouldReconnect) {
          console.log("Connection closed, attempting to reconnect...");
          setTimeout(() => {
            startWhatsAppConnection();
          }, 3000);
        } else {
          console.log("Logged out from WhatsApp");
          broadcast({ type: "disconnected" });
          clearAuthFolder();
        }
      } else if (connection === "open") {
        client.isConnected = true;
        client.isConnecting = false;
        const phoneNumber = socket.user?.id?.split(":")[0] || "";
        console.log("Connected to WhatsApp:", phoneNumber);
        broadcast({ type: "connected", phoneNumber });
      }
    });

    socket.ev.on("messages.upsert", async (m) => {
      console.log("New message received:", JSON.stringify(m, null, 2));
    });
  } catch (error) {
    console.error("Failed to start WhatsApp connection:", error);
    client.isConnecting = false;
    broadcast({ type: "error", message: "فشل في بدء الاتصال" });
  }
}

export async function disconnectWhatsApp() {
  try {
    if (client.socket) {
      await client.socket.logout();
      await cleanupExistingConnection();
      client.isConnected = false;
      client.isConnecting = false;
      clearAuthFolder();
      broadcast({ type: "disconnected" });
    }
  } catch (error) {
    console.error("Failed to disconnect:", error);
    await cleanupExistingConnection();
    client.isConnected = false;
    client.isConnecting = false;
    clearAuthFolder();
    broadcast({ type: "disconnected" });
  }
}

function clearAuthFolder() {
  try {
    if (fs.existsSync(AUTH_FOLDER)) {
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("Failed to clear auth folder:", err);
  }
}

export function handleClientMessage(ws: WsWebSocket, message: string) {
  try {
    const data = JSON.parse(message);

    switch (data.action) {
      case "start":
        startWhatsAppConnection();
        break;
      case "disconnect":
        disconnectWhatsApp();
        break;
      default:
        console.log("Unknown action:", data.action);
    }
  } catch (err) {
    console.error("Failed to parse client message:", err);
  }
}

export function isWhatsAppConnected(): boolean {
  return client.isConnected && client.socket !== null;
}

export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!client.isConnected || !client.socket) {
    return { success: false, error: "WhatsApp غير متصل" };
  }

  try {
    let formattedNumber = phoneNumber.replace(/[^0-9]/g, "");
    
    if (!formattedNumber.includes("@")) {
      formattedNumber = `${formattedNumber}@s.whatsapp.net`;
    }

    const result = await client.socket.sendMessage(formattedNumber, {
      text: message,
    });

    console.log("Message sent:", result?.key?.id);
    
    return { 
      success: true, 
      messageId: result?.key?.id || undefined 
    };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "فشل في إرسال الرسالة" 
    };
  }
}
