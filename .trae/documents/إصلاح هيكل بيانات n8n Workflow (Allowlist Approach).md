# إصلاح خطأ إنشاء Workflow في n8n

لقد قمت بتحليل المشكلة وتبين أن n8n صارم جدًا في الحقول التي يقبلها عند إنشاء Workflow جديد. الخطأ `request/body must NOT have additional properties` يعني أننا نرسل حقولاً غير مسموح بها.

من خلال فحص ملف `Neurt.json`، وجدنا الحقول التالية:
`['name', 'nodes', 'pinData', 'connections', 'active', 'settings', 'versionId', 'meta', 'id', 'tags']`

الحقول المسموح بها عادة في `POST /workflows` هي فقط:
- `name`
- `nodes`
- `connections`
- `settings`
- `staticData` (اختياري)
- `tags` (قد يسبب مشاكل إذا لم تكن التاقات موجودة، والأفضل تجنبه عند الإنشاء الأولي)

الحقول التي تسبب المشكلة بالتأكيد هي: `meta`, `pinData`, `versionId`, `id`, `active`. وفي محاولتي السابقة، قمت بحذف بعضها لكن ربما بقيت `meta` أو أن `tags: []` التي أضفتها صراحةً تسببت في المشكلة لأنها لم تكن في القائمة المسموحة للمثال الذي أرسلته.

## خطة الحل

سأقوم بتعديل ملف `server/n8n.ts` ليعمل بنظام **القائمة البيضاء (Allowlist)** بدلاً من الحذف، لضمان إرسال الحقول المقبولة فقط.

### الخطوات:
1.  **تعديل `server/n8n.ts`**:
    *   بدلاً من `delete workflow[field]`، سأقوم بإنشاء كائن جديد يحتوي فقط على:
        ```javascript
        const newWorkflow = {
          name: companyName,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
          staticData: workflow.staticData, // إن وجد
        };
        ```
    *   لن أقوم بإدراج `tags` أو `shared` أو `meta` أو أي حقل آخر.

2.  **إزالة معالجة العقد (Nodes)**:
    *   سأترك `nodes` كما هي دون تعديل (n8n سيتولى أمر الـ IDs الجديدة).

3.  **رفع التعديلات**:
    *   سأقوم برفع التعديل إلى GitHub لتتمكن من إعادة النشر (Redeploy).

هذا التغيير سيضمن أننا نرسل "Clean JSON" يقبله n8n بدون أي حقول إضافية تسبب الرفض.
