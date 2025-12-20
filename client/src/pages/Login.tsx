import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const registerSchema = z.object({
  companyName: z.string().min(1, "اسم الشركة مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, loginPending, registerPending } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login(data);
      toast({ title: "تم تسجيل الدخول بنجاح", className: "bg-green-600 text-white border-none" });
      setLocation("/");
    } catch (error: any) {
      const errorMessage = error?.message || "حدث خطأ في تسجيل الدخول";
      toast({ title: "خطأ", description: errorMessage, variant: "destructive" });
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    try {
      await register({ companyName: data.companyName, email: data.email, password: data.password, confirmPassword: data.confirmPassword });
      toast({ title: "تم إنشاء الحساب بنجاح", description: "يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب", className: "bg-green-600 text-white border-none" });
      setActiveTab("login"); // Switch to login tab
    } catch (error: any) {
      const errorMessage = error?.message || "حدث خطأ في التسجيل";
      toast({ title: "خطأ", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-red-800/20 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-red-500/10 bg-black/60 backdrop-blur-xl shadow-2xl shadow-red-900/20">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/20"
            >
              <MessageSquare className="w-10 h-10 text-white" />
            </motion.div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                WhatsApp Bot
              </CardTitle>
              <CardDescription className="text-gray-400">
                منصة متكاملة لإدارة حسابات واتساب
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-900/50 p-1 border border-white/5">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all"
                >
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all"
                >
                  حساب جديد
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" key="login">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">البريد الإلكتروني</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-zinc-900/50 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-all h-11"
                                  placeholder="user@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">كلمة المرور</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  className="bg-zinc-900/50 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-all h-11"
                                  placeholder="••••••••"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full h-12 text-base bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/20 transition-all border-none"
                          disabled={loginPending}
                        >
                          {loginPending ? (
                            <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري التحقق...</>
                          ) : (
                            <><ShieldCheck className="w-5 h-5 ml-2" /> تسجيل الدخول</>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>

                <TabsContent value="register" key="register">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4 mt-4">
                        <FormField
                          control={registerForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">اسم الشركة</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-zinc-900/50 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-all h-11"
                                  placeholder="أدخل اسم الشركة"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">البريد الإلكتروني</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-zinc-900/50 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-all h-11"
                                  placeholder="user@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300">كلمة المرور</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    className="bg-zinc-900/50 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-all h-11"
                                    placeholder="••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300">تأكيد</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    className="bg-zinc-900/50 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-all h-11"
                                    placeholder="••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 text-base bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/20 transition-all border-none"
                          disabled={registerPending}
                        >
                          {registerPending ? (
                            <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جارٍ الإنشاء...</>
                          ) : (
                            <><Sparkles className="w-5 h-5 ml-2" /> إنشاء حساب جديد</>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-zinc-600 mt-8 text-sm"
        >
          Secure WhatsApp Automation Platform © 2024
        </motion.p>
      </motion.div>
    </div>
  );
}
