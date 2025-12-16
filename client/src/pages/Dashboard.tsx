import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Wifi, WifiOff, Activity, MessageSquare, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardData {
  accessToken: string;
  messageCount: number;
  whatsappConnected: boolean;
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 5000,
  });

  const sentCount = data?.messageCount || 0;

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 bg-zinc-800" />
          <Skeleton className="h-5 w-96 bg-zinc-800" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-2xl bg-zinc-800" />
          <Skeleton className="h-40 rounded-2xl bg-zinc-800" />
          <Skeleton className="h-40 rounded-2xl bg-zinc-800" />
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          لوحة التحكم <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse mt-2" />
        </h1>
        <p className="text-zinc-400 text-lg">نظرة عامة على أداء البوت وحالة النظام</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Messages Card */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-red-500/20" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">الرسائل المرسلة</CardTitle>
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                <Send className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1" data-testid="text-message-count">
                {sentCount.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-sm">
                <Zap className="h-3 w-3" />
                <span>نشط الآن</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* WhatsApp Status Card */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all ${data?.whatsappConnected ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">حالة WhatsApp</CardTitle>
              <div className={`p-2 rounded-lg ${data?.whatsappConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {data?.whatsappConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-2xl font-bold ${data?.whatsappConnected ? 'text-white' : 'text-zinc-500'}`}>
                  {data?.whatsappConnected ? "متصل بالإنترنت" : "غير متصل"}
                </div>
              </div>
              <Badge
                className={`${data?.whatsappConnected
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/20 text-red-400 border-red-500/20"
                  } px-3 py-1 text-xs`}
                variant="outline"
                data-testid="badge-whatsapp-status"
              >
                {data?.whatsappConnected ? "Online" : "Offline"}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Status Card */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">حالة النظام</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Activity className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">
                99.9%
              </div>
              <p className="text-xs text-zinc-500">
                זمن الاستجابة: 45ms
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Stats Section */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/5 bg-zinc-900/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="h-5 w-5 text-red-500" />
              تفاصيل النشاط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "إجمالي الرسائل", value: sentCount, icon: Send, color: "text-red-500", bg: "bg-red-500/10" },
              { label: "جلسة WhatsApp", value: data?.whatsappConnected ? "Active" : "Inactive", icon: Wifi, color: data?.whatsappConnected ? "text-emerald-500" : "text-zinc-500", bg: data?.whatsappConnected ? "bg-emerald-500/10" : "bg-zinc-500/10" },
              { label: "حالة السيرفر", value: "Healthy", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-black/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{stat.label}</p>
                    <p className="text-xs text-zinc-500">آخر تحديث: الآن</p>
                  </div>
                </div>
                <div className="font-mono font-bold text-xl text-white">{stat.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Placeholder for Chart or More Info */}
        <Card className="border-white/5 bg-zinc-900/30 flex flex-col items-center justify-center text-center p-8 border-dashed">
          <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
            <Activity className="h-10 w-10 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-zinc-400 mb-2">تحليلات متقدمة</h3>
          <p className="text-zinc-600 max-w-xs">سيتم إضافة رسوم بيانية تفصيلية في التحديث القادم.</p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
