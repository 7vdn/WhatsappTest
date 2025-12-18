# تحديث إنشاء Workflow لاستخدام Access Token (اعتماد clu.json)

بناءً على توضيحك بأن `clu.json` هو النسخة المعدلة والمحدثة من `Neurt.json`، سأقوم باعتماده كالقالب الأساسي للإنشاء.

## الخطوات التنفيذية:

1.  **تعديل `server/n8n.ts`**:
    *   تحديث دالة `createCompanyWorkflow` لتستقبل `accessToken`.
    *   تعديل أولوية البحث لتبدأ بـ `clu.json` أولاً.
    *   إضافة كود يمر على جميع العقد (Nodes) في ملف JSON.
    *   إذا كان اسم العقدة يبدأ بـ `WhatsappApi` (مثل `WhatsappApi`, `WhatsappApi2`...):
        *   الوصول إلى `parameters.headerParameters.parameters`.
        *   تحديث قيمة `x-access-token` لتصبح الـ `accessToken` الخاص بالمستخدم الجديد.

2.  **تعديل `server/routes.ts`**:
    *   تحديث استدعاء الدالة لتمرير `user.accessToken` عند تسجيل مستخدم جديد.

3.  **رفع التعديلات**:
    *   رفع التغييرات إلى GitHub ليتسنى لك تجربتها.

هذا التعديل سيجعل الـ Workflow الجديد جاهزاً فور إنشائه مع التوكن الصحيح، دون الحاجة لتعديله يدوياً لاحقاً.
