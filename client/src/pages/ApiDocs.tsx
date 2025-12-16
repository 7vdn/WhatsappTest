import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code, Key, Globe, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface DashboardData {
  accessToken: string;
  messageCount: number;
  whatsappConnected: boolean;
}

export default function ApiDocs() {
  const { toast } = useToast();

  const { data } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ!" });
  };

  const apiEndpoint = typeof window !== "undefined" ? `${window.location.origin}/api/send` : "/api/send";

  const curlExample = `curl -X POST ${apiEndpoint} \\
  -H "x-access-token: ${data?.accessToken || "YOUR_ACCESS_TOKEN"}" \\
  -d "number=966500000000" \\
  -d "message=مرحباً! هذه رسالة تجريبية"`;

  const javascriptExample = `const formData = new URLSearchParams();
formData.append("number", "966500000000");
formData.append("message", "مرحباً! هذه رسالة تجريبية");

const response = await fetch("${apiEndpoint}", {
  method: "POST",
  headers: {
    "x-access-token": "${data?.accessToken || "YOUR_ACCESS_TOKEN"}"
  },
  body: formData
});

const result = await response.json();
console.log(result);`;

  const pythonExample = `import requests

url = "${apiEndpoint}"
headers = {
    "x-access-token": "${data?.accessToken || "YOUR_ACCESS_TOKEN"}"
}
data = {
    "number": "966500000000",
    "message": "مرحباً! هذه رسالة تجريبية"
}

response = requests.post(url, data=data, headers=headers)
print(response.json())`;

  const phpExample = `<?php
$url = "${apiEndpoint}";
$data = [
    "number" => "966500000000",
    "message" => "مرحباً! هذه رسالة تجريبية"
];

$options = [
    "http" => [
        "method" => "POST",
        "header" => "x-access-token: ${data?.accessToken || "YOUR_ACCESS_TOKEN"}\\r\\n",
        "content" => http_build_query($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo $result;
?>`;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">وثائق API</h1>
        <p className="text-muted-foreground">تعلم كيفية استخدام API لإرسال رسائل WhatsApp</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">API Endpoint</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code 
                className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono overflow-x-auto" 
                dir="ltr"
                data-testid="text-api-endpoint"
              >
                POST {apiEndpoint}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(apiEndpoint)}
                data-testid="button-copy-endpoint"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Access Token</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code 
                className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono overflow-x-auto truncate" 
                dir="ltr"
                data-testid="text-access-token-docs"
              >
                {data?.accessToken || "..."}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(data?.accessToken || "")}
                data-testid="button-copy-token-docs"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                حافظ على سرية هذا المفتاح ولا تشاركه مع أحد
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>طريقة الاستخدام</CardTitle>
          <CardDescription>
            أرسل طلب POST مع الـ Access Token والبيانات المطلوبة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Header المطلوب:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Badge variant="outline">x-access-token</Badge>
                <code dir="ltr">{data?.accessToken ? data.accessToken.substring(0, 20) + "..." : "YOUR_TOKEN"}</code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">البيانات المطلوبة (Form Data):</h3>
            <div className="p-4 rounded-lg bg-muted font-mono text-sm" dir="ltr">
              <pre>{`number=966500000000
message=نص الرسالة`}</pre>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>number:</strong> رقم الهاتف مع كود الدولة (بدون + أو 00)</p>
              <p><strong>message:</strong> نص الرسالة المراد إرسالها</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            أمثلة الاستخدام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="curl" data-testid="tab-curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript" data-testid="tab-javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python" data-testid="tab-python">Python</TabsTrigger>
              <TabsTrigger value="php" data-testid="tab-php">PHP</TabsTrigger>
            </TabsList>
            
            <TabsContent value="curl" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm font-mono" dir="ltr">
                  {curlExample}
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(curlExample)}
                  data-testid="button-copy-curl"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="javascript" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm font-mono" dir="ltr">
                  {javascriptExample}
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(javascriptExample)}
                  data-testid="button-copy-javascript"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="python" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm font-mono" dir="ltr">
                  {pythonExample}
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(pythonExample)}
                  data-testid="button-copy-python"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="php" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm font-mono" dir="ltr">
                  {phpExample}
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 left-2"
                  onClick={() => copyToClipboard(phpExample)}
                  data-testid="button-copy-php"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الردود المتوقعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">نجاح (200)</span>
            </div>
            <pre className="p-3 rounded-lg bg-emerald-500/10 text-sm font-mono" dir="ltr">
{`{
  "success": true,
  "messageId": "3EB0...",
  "message": "تم إرسال الرسالة بنجاح"
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="font-medium">Token غير صالح (403)</span>
            </div>
            <pre className="p-3 rounded-lg bg-destructive/10 text-sm font-mono" dir="ltr">
{`{
  "success": false,
  "error": "Access token غير صالح"
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="font-medium">WhatsApp غير متصل (503)</span>
            </div>
            <pre className="p-3 rounded-lg bg-amber-500/10 text-sm font-mono" dir="ltr">
{`{
  "success": false,
  "error": "WhatsApp غير متصل"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
