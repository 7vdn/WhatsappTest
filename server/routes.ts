import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from "express-session";
import { storage, verifyPassword } from "./storage";
import {
  addClient,
  removeClient,
  handleClientMessage,
  isWhatsAppConnected,
  sendWhatsAppMessage,
} from "./whatsapp";
import { insertUserSchema, loginSchema, registerSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "غير مصرح" });
  }
  next();
};

import { createCompanyWorkflow } from "./n8n";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "whatsapp-bot-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.COOKIE_SECURE === "true" || false,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket client connected");
    addClient(ws);

    ws.on("message", (message: Buffer) => {
      handleClientMessage(ws, message.toString());
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      removeClient(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      removeClient(ws);
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMsg = parsed.error.issues[0].message;
        return res.status(400).json({ error: errorMsg });
      }

      const existingUser = await storage.getUserByEmail(parsed.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "البريد الإلكتروني موجود مسبقاً" });
      }

      // We only pass email, password and companyName to storage
      const user = await storage.createUser({
        companyName: parsed.data.companyName,
        email: parsed.data.email,
        password: parsed.data.password,
      });

      // req.session.userId = user.id; // Removed: Do not login immediately

      createCompanyWorkflow(parsed.data.companyName, user.accessToken).catch((err) => {
        console.error("n8n workflow creation failed:", err);
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          // accessToken: user.accessToken, // Optional: Don't send sensitive data if not needed yet
          messageCount: user.messageCount,
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "حدث خطأ في التسجيل" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: "البريد الإلكتروني ورمز التحقق مطلوبان" });
      }

      const isValid = await storage.verifyEmailOtp(email, otp);
      if (!isValid) {
        return res.status(400).json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
      }

      // Get user to set session
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "المستخدم غير موجود" });
      }

      // Set session
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "حدث خطأ في إنشاء الجلسة" });
        }

        req.session.userId = user.id;
        
        res.json({ 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            accessToken: user.accessToken,
            messageCount: user.messageCount,
          }
        });
      });

    } catch (error) {
      console.error("OTP Verification error:", error);
      res.status(500).json({ error: "حدث خطأ في التحقق من الرمز" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "بيانات غير صحيحة" });
      }

      const user = await storage.getUserByEmail(parsed.data.email);
      if (!user) {
        return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }

      const isValidPassword = await verifyPassword(parsed.data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "حدث خطأ في تسجيل الدخول" });
        }

        req.session.userId = user.id;

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            accessToken: user.accessToken,
            messageCount: user.messageCount,
          }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "حدث خطأ في تسجيل الدخول" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "حدث خطأ في تسجيل الخروج" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "غير مصرح" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "المستخدم غير موجود" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        accessToken: user.accessToken,
        messageCount: user.messageCount,
      }
    });
  });

  app.get("/api/dashboard", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ error: "المستخدم غير موجود" });
    }

    res.json({
      accessToken: user.accessToken,
      messageCount: user.messageCount,
      whatsappConnected: isWhatsAppConnected(),
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      whatsapp: {
        connected: isWhatsAppConnected()
      }
    });
  });

  app.get("/api/status", (req, res) => {
    res.json({
      connected: isWhatsAppConnected(),
      status: isWhatsAppConnected() ? "connected" : "disconnected"
    });
  });

  app.post("/api/send", async (req, res) => {
    const headerToken = req.headers["x-access-token"] as string;
    const bodyToken = req.body?.access_token;
    const queryToken = req.query?.access_token as string;

    const token = headerToken || bodyToken || queryToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token مطلوب"
      });
    }

    const user = await storage.getUserByAccessToken(token);
    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Access token غير صالح"
      });
    }

    if (!isWhatsAppConnected()) {
      return res.status(503).json({
        success: false,
        error: "WhatsApp غير متصل"
      });
    }

    const { number, message } = req.body;

    if (!number || !message) {
      return res.status(400).json({
        success: false,
        error: "number و message مطلوبين"
      });
    }

    const result = await sendWhatsAppMessage(number, message);

    if (result.success) {
      await storage.incrementMessageCount(user.id);

      return res.json({
        success: true,
        messageId: result.messageId,
        message: "تم إرسال الرسالة بنجاح"
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  });

  return httpServer;
}
