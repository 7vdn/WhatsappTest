import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Smartphone, Check, X, RefreshCw, QrCode, Copy, Key, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ConnectionStatus = "disconnected" | "connecting" | "qr_ready" | "connected" | "error";

interface ConnectionState {
  status: ConnectionStatus;
  qrCode: string | null;
  error: string | null;
  phoneNumber?: string;
  accessToken?: string;
}

export default function Home() {
  const { toast } = useToast();
  const [state, setState] = useState<ConnectionState>({
    status: "disconnected",
    qrCode: null,
    error: null,
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "qr") {
          setState({
            status: "qr_ready",
            qrCode: data.qr,
            error: null,
          });
        } else if (data.type === "connected") {
          setState({
            status: "connected",
            qrCode: null,
            error: null,
            phoneNumber: data.phoneNumber,
            accessToken: data.accessToken,
          });
        } else if (data.type === "disconnected") {
          setState({
            status: "disconnected",
            qrCode: null,
            error: null,
          });
        } else if (data.type === "error") {
          setState({
            status: "error",
            qrCode: null,
            error: data.message,
          });
        } else if (data.type === "connecting") {
          setState({
            status: "connecting",
            qrCode: null,
            error: null,
          });
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setState({
        status: "disconnected",
        qrCode: null,
        error: null,
      });
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        const newSocket = connectWebSocket();
        setWs(newSocket);
      }, 3000);
    };

    socket.onerror = () => {
      console.error("WebSocket error occurred");
    };

    return socket;
  }, []);

  useEffect(() => {
    const socket = connectWebSocket();
    setWs(socket);
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.close();
    };
  }, [connectWebSocket]);

  const handleStartConnection = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setState({
        status: "connecting",
        qrCode: null,
        error: null,
      });
      ws.send(JSON.stringify({ action: "start" }));
    }
  };

  const handleDisconnect = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "disconnect" }));
    }
  };

  const handleRetry = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setState({
        status: "connecting",
        qrCode: null,
        error: null,
      });
      ws.send(JSON.stringify({ action: "start" }));
    }
  };

  const isButtonDisabled = state.status === "connecting" || state.status === "qr_ready" || state.status === "connected";

  const getStatusBadge = () => {
    switch (state.status) {
      case "disconnected":
        return (
          <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            غير متصل
          </Badge>
        );
      case "connecting":
        return (
          <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
            <Loader2 className="w-3 h-3 animate-spin" />
            جاري الاتصال...
          </Badge>
        );
      case "qr_ready":
        return (
          <Badge className="gap-2 px-4 py-2 text-sm bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
            <QrCode className="w-3 h-3" />
            في انتظار المسح
          </Badge>
        );
      case "connected":
        return (
          <Badge className="gap-2 px-4 py-2 text-sm bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <Check className="w-3 h-3" />
            متصل
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-2 px-4 py-2 text-sm">
            <X className="w-3 h-3" />
            خطأ
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-6 sm:px-8">
        <div className="max-w-md mx-auto flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            مصادقة WhatsApp Bot
          </h1>
          {getStatusBadge()}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {state.status === "disconnected" && (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">ربط حساب WhatsApp</h2>
                  <p className="text-sm text-muted-foreground">
                    اضغط على الزر لإنشاء رمز QR وامسحه من تطبيق WhatsApp
                  </p>
                </div>
                <Button
                  onClick={handleStartConnection}
                  size="lg"
                  className="w-full sm:w-auto px-8 py-4 text-lg font-semibold gap-2"
                  disabled={isButtonDisabled}
                  data-testid="button-add-number"
                >
                  <QrCode className="w-5 h-5" />
                  إضافة رقم
                </Button>
              </div>
            )}

            {state.status === "connecting" && (
              <div className="flex flex-col items-center gap-6 text-center py-8">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">جاري إنشاء رمز QR...</h2>
                  <p className="text-sm text-muted-foreground">
                    يرجى الانتظار قليلاً
                  </p>
                </div>
              </div>
            )}

            {state.status === "qr_ready" && state.qrCode && (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className="border-2 border-border rounded-xl p-8 bg-card dark:bg-card shadow-lg aspect-square max-w-sm mx-auto flex items-center justify-center">
                    <div className="bg-white rounded-lg p-2">
                      <img
                        src={state.qrCode}
                        alt="WhatsApp QR Code"
                        className="w-full h-full max-w-[260px] max-h-[260px] animate-pulse"
                        data-testid="img-qr-code"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">امسح رمز QR</h2>
                  <p className="text-sm text-muted-foreground">
                    افتح WhatsApp ➜ الإعدادات ➜ الأجهزة المرتبطة ➜ ربط جهاز
                  </p>
                </div>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-refresh-qr"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث الرمز
                </Button>
              </div>
            )}

            {state.status === "connected" && (
              <div className="flex flex-col items-center gap-6 text-center w-full">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    تم الاتصال بنجاح!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp Bot جاهز للاستخدام
                  </p>
                  {state.phoneNumber && (
                    <p className="text-xs font-mono bg-muted px-3 py-1 rounded-md" data-testid="text-phone-number">
                      {state.phoneNumber}
                    </p>
                  )}
                </div>

                {state.accessToken && (
                  <div className="w-full space-y-4 border-t border-border pt-6">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                      <Send className="w-4 h-4" />
                      <span>معلومات API للإرسال</span>
                    </div>
                    
                    <div className="space-y-3 text-right">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">API Endpoint:</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono text-left overflow-x-auto" dir="ltr" data-testid="text-api-endpoint">
                            {window.location.origin}/api/send
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/api/send`);
                              toast({ title: "تم النسخ!", description: "تم نسخ رابط API" });
                            }}
                            data-testid="button-copy-endpoint"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Key className="w-3 h-3" />
                          Access Token:
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono text-left overflow-x-auto" dir="ltr" data-testid="text-access-token">
                            {state.accessToken}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(state.accessToken || "");
                              toast({ title: "تم النسخ!", description: "تم نسخ Access Token" });
                            }}
                            data-testid="button-copy-token"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-md text-xs space-y-2" dir="ltr">
                        <p className="font-medium text-right" dir="rtl">طريقة الاستخدام:</p>
                        <div className="text-left text-muted-foreground font-mono space-y-1">
                          <p>POST /api/send</p>
                          <p>Header: x-access-token: [TOKEN]</p>
                          <p>Body: {"{ number, message }"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="gap-2 px-4 py-2 text-sm"
                  data-testid="button-disconnect"
                >
                  <X className="w-4 h-4" />
                  قطع الاتصال
                </Button>
              </div>
            )}

            {state.status === "error" && (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center">
                  <X className="w-12 h-12 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-destructive">
                    حدث خطأ
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {state.error || "فشل الاتصال بـ WhatsApp"}
                  </p>
                </div>
                <Button
                  onClick={handleStartConnection}
                  className="gap-2 px-8 py-4 text-lg font-semibold"
                  data-testid="button-retry"
                >
                  <RefreshCw className="w-5 h-5" />
                  إعادة المحاولة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          مدعوم بـ Baileys Library
        </p>
      </footer>
    </div>
  );
}
