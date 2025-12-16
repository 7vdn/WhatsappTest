import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Smartphone, Check, X, RefreshCw, Scan } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ConnectionStatus = "disconnected" | "connecting" | "qr_ready" | "connected" | "error";

interface ConnectionState {
  status: ConnectionStatus;
  qrCode: string | null;
  error: string | null;
  phoneNumber?: string;
}

export default function AddNumber() {
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

  const isButtonDisabled = state.status === "connecting" || state.status === "qr_ready" || state.status === "connected";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-5xl font-bold text-white tracking-tighter">
          مركز الربط <span className="text-red-500">.</span>
        </h1>
        <p className="text-zinc-400 text-lg">
          قم بمسح رمز QR لربط حساب WhatsApp الخاص بك بالمنصة
        </p>
      </div>

      <Card className="w-full max-w-xl mx-auto border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />

        <CardContent className="p-12 min-h-[400px] flex flex-col items-center justify-center relative">
          <AnimatePresence mode="wait">

            {/* Disconnected State */}
            {state.status === "disconnected" && (
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-8 text-center"
              >
                <div className="relative group cursor-pointer" onClick={isButtonDisabled ? undefined : handleStartConnection}>
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl group-hover:bg-red-500/30 transition-all duration-500" />
                  <div className="w-32 h-32 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center relative z-10 transition-transform group-hover:scale-105">
                    <Scan className="w-12 h-12 text-zinc-400 group-hover:text-red-500 transition-colors duration-300" />
                  </div>
                  <div className="absolute -bottom-2 md:bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900 px-3 py-1 rounded-full border border-white/10 text-xs text-white uppercase tracking-wider font-mono">
                    Start Scan
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">جاهز للاتصال</h3>
                  <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                    اضغط على الرمز أعلاه لبدء جلسة جديدة وإنشاء رمز QR
                  </p>
                </div>
              </motion.div>
            )}

            {/* Connecting State */}
            {state.status === "connecting" && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl animate-pulse" />
                  <div className="w-24 h-24 flex items-center justify-center relative">
                    <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-medium text-white">جاري تحضير الجلسة...</h3>
                  <p className="text-zinc-500 text-sm">يتم إنشاء رمز آمن مشفر</p>
                </div>
              </motion.div>
            )}

            {/* QR Ready State */}
            {state.status === "qr_ready" && state.qrCode && (
              <motion.div
                key="qr_ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-6 w-full"
              >
                <div className="relative p-1 rounded-3xl bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-2xl">
                  {/* Laser Scanning Effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-3xl z-20 pointer-events-none">
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_20px_rgb(239,68,68)] opacity-50"
                    />
                  </div>

                  <div className="bg-white p-4 rounded-2xl relative z-10">
                    <img
                      src={state.qrCode}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Waiting for scan...
                  </div>
                  <p className="text-zinc-400 text-sm">
                    افتح WhatsApp {'>'} الأجهزة المرتبطة {'>'} ربط جهاز
                  </p>
                </div>
              </motion.div>
            )}

            {/* Connected State */}
            {state.status === "connected" && (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                  <Check className="w-12 h-12 text-emerald-500 relative z-10" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white">تم الربط بنجاح</h2>
                  <p className="text-zinc-400">حسابك متصل وجاهز للاستخدام</p>
                </div>

                {state.phoneNumber && (
                  <div className="bg-zinc-900/50 border border-white/5 px-6 py-3 rounded-xl flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-zinc-500" />
                    <span className="font-mono text-lg text-emerald-400 tracking-wide">
                      {state.phoneNumber}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="mt-4 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                >
                  <X className="w-4 h-4 mr-2" />
                  قطع الاتصال
                </Button>
              </motion.div>
            )}

            {/* Error State */}
            {state.status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-red-500">فشل الاتصال</h3>
                  <p className="text-zinc-400 max-w-xs">{state.error || "حدث خطأ غير متوقع أثناء محاولة الاتصال"}</p>
                </div>
                <Button
                  onClick={handleStartConnection}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> المحاولة مرة أخرى
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
