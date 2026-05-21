# MODEYA - Implementation Plan
# خطة صيانة وتصحيح وتحسين الواجهات الأمامية

> **المشروع:** MODEYA - Fashion Boutique  
> **التاريخ:** 2026-05-21  
> **النطاق:** فحص QA شامل لجميع الصفحات مع تركيز على لوحات التحكم الإدارية  

---

## الملخص التنفيذي

بعد فحص شامل لكل ملفات المشروع (18 ملف مصدري، ~3200 سطر كود) + أعطال مُبلغ عنها من المستخدم، تم تحديد **78 مشكلة** مصنفة كالتالي:
- **حرجة (Critical):** 9 مشاكل - أمنية ووظيفية تمنع الاستخدام الفعلي
- **أعطال مُبلغ عنها (User-Reported Bugs):** 10 أعطال - مشاكل واجهها المستخدم مباشرة
- **عالية (High):** 19 مشكلة - وظائف ناقصة ومعلنة لكن غير مُنفذة
- **متوسطة (Medium):** 22 مشكلة - UX وجودة الكود والأداء
- **منخفضة (Low):** 18 مشكلة - تحسينات وتنظيف كود

---

## القسم 1: مشاكل حرجة (Critical) - يجب إصلاحها أولاً

### CR-01: تسريب مفتاح API في الواجهة الأمامية
- **الملف:** `vite.config.ts:14` + `UserDashboard.tsx:213`
- **المشكلة:** مفتاح Gemini API يُضمّن في كود JavaScript المرسل للمتصفح عبر `process.env.API_KEY`. أي زائر يمكنه رؤيته من Developer Tools.
- **الإصلاح:** نقل استدعاء Gemini AI إلى Backend/API Route أو استخدام serverless function (Vercel/Netlify Functions). مفاتيح الـ API يجب ألا تكون في الكود الأمامي أبداً.
- **الأولوية:** P0
- **الجهد:** 4-6 ساعات

### CR-02: لا يوجد نظام مصادقة حقيقي
- **الملف:** `LoginPage.tsx` + `App.tsx:96-99`
- **المشكلة:** نموذج تسجيل الدخول لا يتحقق من أي بيانات — أي إدخال يسمح بالدخول كأي دور (مدير/مصمم/خياط). لا يوجد JWT أو sessions أو حماية routes.
- **الإصلاح:** 
  1. إضافة backend authentication (Firebase Auth / Supabase / custom API)
  2. إضافة route guards تمنع الوصول غير المصرح لصفحات الإدارة
  3. التحقق من الدور على مستوى الخادم وليس العميل فقط
- **الأولوية:** P0
- **الجهد:** 8-12 ساعة

### CR-03: UserDashboard ملف عملاق (857 سطر) يعاد رسمه بالكامل
- **الملف:** `UserDashboard.tsx`
- **المشكلة:** 12+ مكون فرعي معرّف داخل المكون الأب. كل مكون فرعي (DesignStudio, AdminProducts, AdminUsers, إلخ) يُعاد إنشاؤه في كل render مما يسبب:
  - فقدان حالة الإدخال عند أي تحديث
  - أداء سيء
  - صعوبة الصيانة
- **الإصلاح:**
  1. استخراج كل sub-component إلى ملف منفصل في `components/dashboard/`
  2. استخدام `React.memo` حيث يلزم
  3. نقل state مشتركة إلى Context أو Zustand
- **الأولوية:** P0
- **الجهد:** 6-8 ساعات

### CR-04: Tailwind CDN في الإنتاج
- **الملف:** `index.html:8`
- **المشكلة:** `<script src="https://cdn.tailwindcss.com">` مخصص للتطوير فقط. Tailwind أنفسهم يحذرون من استخدامه في الإنتاج — يسبب حجم كبير وبطء في التحميل.
- **الإصلاح:** تثبيت Tailwind CSS كـ PostCSS plugin في build pipeline الخاص بـ Vite.
- **الأولوية:** P0
- **الجهد:** 1-2 ساعة

### CR-05: لا يوجد routing حقيقي
- **الملف:** `App.tsx:17-20`
- **المشكلة:** التنقل يعتمد على `useState<Page>`. زر Back/Forward في المتصفح لا يعمل. لا يمكن مشاركة روابط مباشرة. التحديث يفقد الصفحة الحالية.
- **الإصلاح:** إضافة `react-router-dom` مع routes محمية للداشبورد.
- **الأولوية:** P1
- **الجهد:** 4-6 ساعات

### CR-06: لا يوجد تنقل على الموبايل في الداشبورد
- **الملف:** `UserDashboard.tsx:717`
- **المشكلة:** الشريط الجانبي `hidden md:flex` — على الشاشات الصغيرة لا يوجد أي طريقة للتنقل.
- **الإصلاح:** إضافة hamburger menu مع sidebar قابل للطي على الموبايل.
- **الأولوية:** P1
- **الجهد:** 3-4 ساعات

### CR-07: Admin Wallet يسمح برصيد سالب
- **الملف:** `UserDashboard.tsx:844-847`
- **المشكلة:** عند خصم رصيد من محفظة المستخدم، لا يوجد تحقق من:
  - أن المبلغ رقم صالح (ليس NaN)
  - أن الرصيد كافي (يمكن الوصول لرصيد سالب)
  - أن المبلغ أكبر من صفر
- **الإصلاح:** إضافة validation قبل تحديث الرصيد مع رسائل خطأ مناسبة.
- **الأولوية:** P1
- **الجهد:** 30 دقيقة

### CR-08: البيانات لا تُحفظ عند إعادة التحميل
- **الملف:** `App.tsx`
- **المشكلة:** فقط `savedDesigns` محفوظ في localStorage. السلة، الطلبات، المنتجات المعدلة، المستخدمون — كلها تختفي عند إعادة تحميل الصفحة.
- **الإصلاح:** حفظ في localStorage كحل مؤقت، أو الأفضل: ربط مع backend/database.
- **الأولوية:** P1
- **الجهد:** 2-4 ساعات (localStorage) / 16+ ساعة (backend)

### CR-09: لا يوجد نظام تصنيفات (Categories) للمنتجات
- **الملف:** `types.ts` + `constants.tsx` + `UserDashboard.tsx`
- **المشكلة:** المنتجات ليس لها تصنيفات (فساتين، بلوزات، تنانير...). لا يمكن تنظيم المتجر أو فلترة المنتجات. حتى Footer يعرض روابط تصنيفات (Dresses, Tops, Skirts) لكنها لا تقود لأي مكان.
- **الإصلاح:**
  1. إضافة `category` field في نوع `Product`
  2. بناء واجهة إدارة التصنيفات في لوحة التحكم
  3. إضافة فلتر بالتصنيف في صفحة المتجر
  4. ربط روابط Footer بالفلتر
- **الأولوية:** P1
- **الجهد:** 4-6 ساعات

---

## القسم 1.5: أعطال مُبلغ عنها من المستخدم (User-Reported Bugs)

> **تنبيه:** الأعطال BUG-01 إلى BUG-04 تشترك في **سبب جذري واحد** — وهو CR-03 (تعريف المكونات الفرعية داخل المكون الأب). الإصلاح الجذري يحل الأربعة دفعة واحدة.

### السبب الجذري المشترك: لماذا "تتحدث الصفحة" عند كل تعديل؟

```
المشكلة التقنية:
━━━━━━━━━━━━━━━

في UserDashboard.tsx، كل اللوحات الإدارية (AdminProducts, AdminUsers,
AdminPayments, AdminSocials...) معرّفة كـ functions داخل المكون الرئيسي:

  const UserDashboard = () => {
    const [users, setUsers] = useState(...)    // ← state في الأب
    
    const AdminUsers = () => (                 // ← مكون فرعي داخل الأب
      <table>...</table>
    )
    
    return <AdminUsers />
  }

كل ما تتغير أي state (حتى ضغطة زر أو كتابة حرف)، React يعيد تنفيذ
UserDashboard بالكامل. عند إعادة التنفيذ:

  1. AdminUsers يُعاد تعريفها كـ function جديدة
  2. React يظن إنها مكون جديد تماماً (لأن المرجع تغيّر)
  3. React يحذف المكون القديم ويرسم واحد جديد من الصفر
  4. كل حقول الإدخال تضيع محتواها وتخسر الـ focus

النتيجة: أي تفاعل (كتابة، ضغط، toggle) يبدو كأنه "تحديث كامل للصفحة"
```

```
الحل:
━━━━━

نقل كل مكون فرعي إلى ملف منفصل خارج UserDashboard:

  // components/dashboard/admin/AdminUsers.tsx  ← ملف مستقل
  const AdminUsers: React.FC<Props> = ({ users, setUsers }) => (
    <table>...</table>
  )
  export default AdminUsers

  // UserDashboard.tsx
  import AdminUsers from './admin/AdminUsers'
  
  const UserDashboard = () => {
    return <AdminUsers users={users} setUsers={setUsers} />
  }

الآن AdminUsers هو نفس المرجع في كل render — React يعرف إنه نفس
المكون فيُحدّثه بدل ما يحذفه ويعيد إنشائه.
```

---

### BUG-01: تعديل الأسعار — الصفحة تتحدث عند كل رقم
- **الوصف:** عند تعديل سعر منتج في لوحة المنتجات، كل ما تكتب رقم الصفحة تتحدث وتخسر الـ focus. ما بخليك تكتب أكثر من رقم واحد.
- **الموقع:** لوحة التحكم → إدارة المنتجات → تعديل السعر
- **السبب الجذري:** CR-03 — `AdminProducts` معرّف كـ arrow function داخل `UserDashboard` (سطر 354). أي تغيير في state يعيد إنشاء المكون من الصفر.
- **الإصلاح:**
  1. **جذري:** استخراج `AdminProducts` إلى ملف `components/dashboard/admin/AdminProducts.tsx` منفصل
  2. **إضافي:** بناء مودال تعديل المنتج مع حقل سعر يستخدم local state ويُحفظ عند الضغط على "حفظ" (بدلاً من تعديل مباشر على products state)
- **الأولوية:** P0
- **يحله:** CR-03 + H-02

### BUG-02: تعديل أسماء المستخدمين — نفس مشكلة التحديث
- **الوصف:** عند محاولة تعديل أسماء المستخدمين، نفس المشكلة — كل حرف يحدّث الصفحة.
- **الموقع:** لوحة التحكم → إدارة المستخدمين
- **السبب الجذري:** CR-03 — `AdminUsers` معرّف داخل `UserDashboard` (سطر 550)
- **الإصلاح:**
  1. **جذري:** استخراج `AdminUsers` إلى ملف منفصل
  2. **إضافي:** بناء مودال تعديل المستخدم مع local state بدلاً من التعديل المباشر على الجدول
- **الأولوية:** P0
- **يحله:** CR-03

### BUG-03: حذف مستخدم — أي زر يُحدّث الصفحة كلها
- **الوصف:** عند الضغط على أي زر في صف المستخدم (حذف، إدارة المحفظة)، الصفحة كلها تتحدث.
- **الموقع:** لوحة التحكم → إدارة المستخدمين → أزرار الإجراءات
- **السبب الجذري:** CR-03 — نفس مشكلة إعادة إنشاء المكون. بالإضافة: `confirm()` (سطر 582) يُوقف الـ thread الرئيسي مما يزيد الإحساس بالتجمد.
- **الملف:** `UserDashboard.tsx:580-582`
- **الإصلاح:**
  1. **جذري:** استخراج `AdminUsers` إلى ملف منفصل (يحل مشكلة التحديث)
  2. **إضافي:** استبدال `confirm()` بمودال تأكيد مخصص بتصميم glass يتناسب مع الداشبورد
  3. **إضافي:** إضافة `React.useCallback` لدوال الحذف والتعديل
- **الأولوية:** P0
- **يحله:** CR-03 + H-08

### BUG-04: تفعيل/تعطيل طرق الدفع — الصفحة تتحدث بالكامل
- **الوصف:** وقت بتفعل أو بتعطل نوع حوالة (مثلاً Syriatel Cash)، الصفحة كلها تتجدد بدل ما يتغير الـ toggle بس.
- **الموقع:** لوحة التحكم → إعدادات الدفع → مفاتيح التفعيل
- **السبب الجذري:** CR-03 — `AdminPayments` معرّف داخل `UserDashboard` (سطر 593). استدعاء `setPaymentMethods` يُحدّث state في الأب فيعيد إنشاء كل المكونات الداخلية.
- **الملف:** `UserDashboard.tsx:608-609`
- **الإصلاح:**
  1. **جذري:** استخراج `AdminPayments` إلى ملف منفصل
  2. **إضافي:** نقل `paymentMethods` state إلى المكون المنفصل أو إلى Context مشترك
- **الأولوية:** P0
- **يحله:** CR-03

### BUG-05: زر "إعدادات" في طرق الدفع لا يعمل
- **الوصف:** وقت بضغط على زر "إعدادات" (Configure) تحت أي طريقة دفع ما بصير شي — لا مودال ولا صفحة.
- **الموقع:** لوحة التحكم → إعدادات الدفع → زر "إعدادات" تحت كل طريقة
- **الملف:** `UserDashboard.tsx:619`
- **السبب المباشر:** الزر `<button>` بدون `onClick` handler — حرفياً لا يفعل شيء:
  ```tsx
  // الكود الحالي:
  <button className="...">
      {t('admin_payments_configure')}
  </button>
  // ← لا يوجد onClick!
  ```
- **الإصلاح:** بناء مودال تكوين لكل طريقة دفع يتضمن:
  - **حوالة موبايل (Syriatel/MTN):** حقل رقم الهاتف المستقبل
  - **حوالة مالية (الهرم):** اسم المستلم الثلاثي، رقم الهاتف، المدينة
  - **PayPal:** بريد الحساب
  - **Stripe/Visa/Mastercard:** إعدادات المفتاح
  - **مركز معتمد:** العنوان وأوقات الدوام
  - **حوالة بنكية:** رقم الحساب IBAN، اسم البنك
  - زر حفظ يُحدّث `paymentMethods[id].details`
- **الأولوية:** P1
- **الجهد:** 4 ساعات
- **يحله:** H-09

### BUG-06: صور/أيقونات الحوالات البنكية مفقودة
- **الوصف:** أيقونات طرق الدفع البنكية (Bank Transfer، Al Baraka Bank) لا تظهر — الصور ضائعة.
- **الموقع:** لوحة التحكم → إعدادات الدفع → كروت bank_transfer و baraka
- **الملف:** `UserDashboard.tsx:152-153`
- **السبب المباشر:** الأيقونات تستخدم روابط flaticon عامة قد لا تكون دقيقة:
  ```
  bank_transfer: https://cdn-icons-png.flaticon.com/512/2830/2830284.png
  baraka:        https://cdn-icons-png.flaticon.com/512/2830/2830289.png
  ```
  هذه الروابط قد تكون محذوفة أو تحتاج اشتراك Flaticon Premium. بالإضافة: لا يوجد `onError` fallback للصور.
- **الإصلاح:**
  1. استبدال بأيقونات SVG محلية أو من مكتبة أيقونات موثوقة
  2. إضافة `onError` handler يعرض أيقونة بديلة عند فشل التحميل:
     ```tsx
     <img 
       src={method.imgUrl} 
       onError={(e) => { e.currentTarget.src = '/fallback-bank-icon.svg' }}
       alt={method.id} 
     />
     ```
  3. الأفضل: تضمين أيقونات البنوك كـ inline SVG بدلاً من الاعتماد على CDN خارجي
- **الأولوية:** P1
- **الجهد:** 1-2 ساعة

### BUG-07: إضافة منتج جديد — بدي رابط أو صورة مش placeholder
- **الوصف:** زر "إضافة منتج" ينشئ منتج مباشرة بصورة placeholder بدون أي نموذج — المطلوب إدخال رابط صورة أو رفع صورة فعلية.
- **الموقع:** لوحة التحكم → إدارة المنتجات → زر "إضافة منتج"
- **الملف:** `UserDashboard.tsx:362-371`
- **السبب المباشر:** الكود ينشئ المنتج مباشرة بدون أي مودال:
  ```tsx
  // الكود الحالي — ينشئ المنتج فوراً:
  onClick={() => {
    const newProduct: Product = {
      id: Date.now(),
      name: 'product_new_name',
      price: 0,                                          // ← سعر صفر
      imageUrls: ['https://placehold.co/400x600?text=New+Product'], // ← placeholder
      sizes: ['S', 'M', 'L']
    };
    setProducts([...products, newProduct]);
  }}
  ```
- **الإصلاح:** بناء مودال إضافة/تعديل منتج يتضمن:
  1. حقل اسم المنتج (عربي + إنجليزي)
  2. حقل السعر مع validation
  3. **حقل رابط الصورة (URL)** مع معاينة فورية
  4. **رفع صورة:** إضافة `<input type="file" accept="image/*">` مع:
     - معاينة الصورة المرفوعة
     - تحويل إلى Base64 أو رفع إلى خدمة تخزين (Cloudinary/S3)
  5. اختيار المقاسات المتاحة
  6. اختيار التصنيف (بعد تنفيذ CR-09)
  7. حقل الوصف
  8. زري "حفظ" و "إلغاء"
- **الأولوية:** P1
- **الجهد:** 4-5 ساعات
- **يحله:** H-01 + H-04

### BUG-08: إضافة قصات جديدة لاستوديو التصميم (أصول التصميم)
- **الوصف:** بدي أقدر أضيف قصات (tops, bottoms, sleeves, fabrics, embellishments) جديدة من لوحة التحكم — حالياً ما فيه صفحة لهالشي.
- **الموقع:** لوحة التحكم → (غير موجودة في القائمة الجانبية)
- **الملف:** `UserDashboard.tsx` — الصفحة `admin-design-assets` معلنة في النوع (سطر 37) لكن:
  1. **غير موجودة في sidebar** — لا يوجد SidebarItem لها في قائمة المدير
  2. **غير مُنفّذة** — لا يوجد مكون يرسمها
  3. `setDressParts` يُمرر كـ prop لكن لا يُستدعى أبداً
- **الإصلاح:** بناء صفحة `AdminDesignAssets` كاملة:
  1. **إضافتها للقائمة الجانبية** ضمن قسم الإدارة
  2. **عرض الأصول الحالية** مصنّفة بالنوع (top/bottom/sleeve/fabric/embellishment) مع tabs أو أقسام
  3. **مودال إضافة أصل جديد** يتضمن:
     - اختيار النوع (dropdown: top, bottom, sleeve, fabric, embellishment)
     - اسم القطعة (عربي + إنجليزي)
     - رابط صورة أو رفع صورة
     - معاينة فورية
  4. **تعديل/حذف** الأصول الموجودة
  5. **ربط مع DesignStudio** — الأصول الجديدة تظهر مباشرة في استوديو التصميم
  6. استخدام `setDressParts` (الموجود أصلاً كـ prop) لتحديث القائمة
- **الأولوية:** P1
- **الجهد:** 6-8 ساعات
- **يحله:** M-05 + L-09

### BUG-09: إضافة تصنيفات للمنتجات
- **الوصف:** بدي أقدر أصنّف المنتجات (فساتين سهرة، فساتين زفاف، بلوزات، تنانير...) بدل ما كلها بمكان واحد.
- **الموقع:** عام — غير موجود حالياً في أي مكان
- **السبب:** لا يوجد حقل `category` في نوع `Product` ولا واجهة لإدارة التصنيفات
- **الإصلاح:** (مربوط بـ CR-09)
  1. **تعديل النوع:**
     ```tsx
     // types.ts
     export interface ProductCategory {
       id: string;
       nameKey: string; // مفتاح ترجمة
     }
     
     export interface Product {
       // ... الحقول الموجودة
       categoryId?: string; // ← جديد
     }
     ```
  2. **بناء إدارة التصنيفات في لوحة التحكم:**
     - صفحة أو قسم لإضافة/تعديل/حذف التصنيفات
     - ربط التصنيف عند إضافة/تعديل منتج
  3. **فلتر في صفحة المتجر (ShopPage):**
     - شريط تصنيفات فوق شبكة المنتجات
     - فلتر المنتجات حسب التصنيف المختار
  4. **ربط روابط Footer:**
     - Footer يعرض روابط (Dresses, Tops, Skirts...) — ربطها بالفلتر في المتجر
- **الأولوية:** P1
- **الجهد:** 4-6 ساعات

### BUG-10: زر "بدء المحادثة" / الدعم الفني لا يعمل
- **الوصف:** وقت بضغط على زر بدء المحادثة مع الدعم الفني ما بصير شي.
- **الموقع:** عدة مواقع محتملة — ProductModal (customization help) + أي مكان فيه رابط تواصل
- **الملف:** `ProductModal.tsx:113` — يوجد رقم هاتف فقط:
  ```tsx
  <a href="tel:1234567890" className="...">123-456-7890</a>
  ```
  لا يوجد نظام chat أو messaging مُنفّذ في المشروع.
- **الإصلاح المُقترح (تدريجي):**

  **المرحلة الأولى — حل سريع (1 ساعة):**
  - إضافة زر WhatsApp/Telegram يفتح محادثة مباشرة مع رقم الدعم:
    ```tsx
    <a href="https://wa.me/96399XXXXXXX" target="_blank">
      بدء محادثة WhatsApp
    </a>
    ```
  - تحديث رقم الهاتف الوهمي `123-456-7890` برقم فعلي
  
  **المرحلة الثانية — Chat داخلي (8-12 ساعة):**
  - بناء نظام محادثة بسيط داخل الداشبورد
  - المكونات المطلوبة:
    - `ChatWidget.tsx` — نافذة محادثة عائمة
    - `ChatProvider` — Context لإدارة الرسائل
  - ربط بين الزبون والخياط/الدعم
  - الهيكل الأساسي موجود: `ChatMessage` type و `chatHistory` field في `Order`
  - يحتاج: WebSocket أو Firebase Realtime Database للتواصل الفوري
- **الأولوية:** P2 (المرحلة الأولى P1)
- **الجهد:** 1 ساعة (WhatsApp) / 8-12 ساعة (Chat كامل)

---

## القسم 2: لوحات التحكم الإدارية — مشاكل وظيفية (High)

### 2A: لوحة إدارة المنتجات (Admin Products)

| # | المشكلة | الملف:السطر | الوصف | الجهد |
|---|---------|-------------|-------|-------|
| H-01 | لا يوجد نموذج إضافة منتج | `UserDashboard.tsx:362-371` | زر "إضافة منتج" ينشئ منتج بسعر 0 وصورة placeholder مباشرة بدون أي نموذج إدخال | 3 ساعات |
| H-02 | لا يوجد وظيفة تعديل | `UserDashboard.tsx:354-399` | لا يمكن تعديل اسم أو سعر أو صور المنتج رغم وجود مفتاح ترجمة `admin_products_action_edit` | 3 ساعات |
| H-03 | حذف بدون تأكيد | `UserDashboard.tsx:384-386` | زر الحذف يحذف فوراً بدون `confirm()` — رغم وجود مفتاح `admin_products_delete_confirm` في الترجمات | 15 دقيقة |
| H-04 | لا يوجد رفع صور | `UserDashboard.tsx:367` | المنتجات الجديدة تستخدم placeholder — لا يوجد آلية رفع أو إدخال URL | 2 ساعة |
| H-05 | لا يوجد إدارة مخزون (Stock) | `types.ts:18` | النوع `Product` يدعم `stock` لكنه غير مُستخدم في أي واجهة | 3 ساعات |

### 2B: لوحة إدارة المستخدمين (Admin Users)

| # | المشكلة | الملف:السطر | الوصف | الجهد |
|---|---------|-------------|-------|-------|
| H-06 | لا يوجد زر إضافة مستخدم | `UserDashboard.tsx:550-591` | رغم وجود مفتاح `admin_users_add_button` في الترجمات | 2 ساعة |
| H-07 | لا يوجد بحث أو فلتر | `UserDashboard.tsx:557` | الجدول يعرض كل المستخدمين بدون إمكانية البحث بالاسم أو الفلترة بالدور | 2 ساعة |
| H-08 | Confirm dialog بدائي | `UserDashboard.tsx:582` | استخدام `confirm()` الأصلي — تجربة مستخدم سيئة وغير متوافقة مع تصميم الموقع | 1 ساعة |

### 2C: لوحة إعدادات الدفع (Admin Payments)

| # | المشكلة | الملف:السطر | الوصف | الجهد |
|---|---------|-------------|-------|-------|
| H-09 | زر "إعدادات" لا يعمل | `UserDashboard.tsx:619` | `<button>` بدون `onClick` — لا يفتح أي modal أو نموذج تكوين | 3 ساعات |
| H-10 | لا يوجد إضافة طريقة دفع جديدة | `UserDashboard.tsx:593-626` | القائمة ثابتة بدون إمكانية الإضافة | 2 ساعة |
| H-11 | التغييرات لا تُحفظ | `UserDashboard.tsx:608-609` | تبديل تفعيل/تعطيل يحدّث state فقط — يختفي عند إعادة التحميل | 1 ساعة |

### 2D: لوحة التواصل الاجتماعي (Admin Socials)

| # | المشكلة | الملف:السطر | الوصف | الجهد |
|---|---------|-------------|-------|-------|
| H-12 | "حفظ التغييرات" وهمي | `UserDashboard.tsx:439` | `alert(t('admin_socials_success'))` بدون أي حفظ فعلي | 30 دقيقة |
| H-13 | تعديل مباشر للمصفوفة | `UserDashboard.tsx:418-419` | `newLinks[idx].href = e.target.value` — mutation مباشر قد يسبب مشاكل في React | 30 دقيقة |
| H-14 | لا يوجد تحقق من URL | `UserDashboard.tsx:413-420` | لا validation على الروابط المدخلة | 30 دقيقة |

### 2E: لوحة إدارة الطلبات (Admin Orders)

| # | المشكلة | الملف:السطر | الوصف | الجهد |
|---|---------|-------------|-------|-------|
| H-15 | جدول للقراءة فقط | `UserDashboard.tsx:446-477` | لا يوجد أي أزرار إجراء (عرض/تعديل/إلغاء) رغم وجود ترجمات لها | 4 ساعات |
| H-16 | لا يوجد تصفح صفحات | `UserDashboard.tsx:462` | يعرض كل الطلبات دفعة واحدة | 2 ساعة |
| H-17 | لا يوجد فلتر بالحالة | `UserDashboard.tsx:446` | لا يمكن تصفية الطلبات حسب الحالة | 1 ساعة |

### 2F: لوحة الموافقات (Admin Approvals)

| # | المشكلة | الملف:السطر | الوصف | الجهد |
|---|---------|-------------|-------|-------|
| H-18 | لا يوجد أزرار موافقة/رفض | `UserDashboard.tsx:797` | تستخدم `ProfessionalPortfolio` الذي يعرض فقط بدون أي إجراءات إدارية | 3 ساعات |
| H-19 | portfolioItems لا يُحدَّث | `UserDashboard.tsx:157` | `const [portfolioItems]` بدون setter — مستحيل تغيير حالة العناصر | 30 دقيقة |

---

## القسم 3: صفحات غير مُنفذة (معلنة لكن تعرض "قريباً")

| # | الصفحة | DashboardView Key | الحالة | الجهد المقدّر |
|---|--------|-------------------|--------|-------------|
| M-01 | إعدادات الملف الشخصي | `profile` | Fallback "coming soon" رغم وجود كل الترجمات | 3 ساعات |
| M-02 | المحفظة الشخصية | `wallet` | State موجود (`walletBalance`, `showTopUpModal`) لكن لا UI | 4 ساعات |
| M-03 | طلباتي (للزبون) | `orders` | Fallback "coming soon" | 3 ساعات |
| M-04 | طلبات العملاء (للخياط) | `requests` | Fallback "coming soon" | 4 ساعات |
| M-05 | إدارة أصول التصميم | `admin-design-assets` | غير موجود في sidebar وغير مُنفذ رغم وجود ترجمات | 4 ساعات |
| M-06 | معرض المصمم | `designer-portfolio` | معلن في النوع لكن غير مربوط | 3 ساعات |

---

## القسم 4: مشاكل UX والتصميم (Medium)

| # | المشكلة | الملف | الوصف | الجهد |
|---|---------|-------|-------|-------|
| M-07 | نصوص إنجليزية ثابتة في صفحة تسجيل الدخول | `LoginPage.tsx:218-225` | العناوين الجانبية ("Discover Your Elegance." إلخ) لا تترجم للعربية | 1 ساعة |
| M-08 | "Select Color" غير مترجم | `ProductModal.tsx:180` | نص ثابت بالإنجليزية في واجهة التخصيص | 5 دقائق |
| M-09 | رسالة Contact Form غير مترجمة | `Contact.tsx:23` | `alert('Thank you for your message!')` | 5 دقائق |
| M-10 | "Join as" غير مترجم | `LoginPage.tsx:129` | `Join as {t(...)}` — كلمة "Join as" ثابتة | 5 دقائق |
| M-11 | معلومات تواصل وهمية | `Footer.tsx:43-44` | `123-456-7890`, `info@mysite.com`, `123 Street Name` | 15 دقيقة |
| M-12 | Copyright قديم | `en.ts:449` | `© 2035 by MODEYA. Proudly created with Wix.com` — تاريخ وهمي ويذكر Wix | 5 دقائق |
| M-13 | Header لا يتضمن hamburger menu | `Header.tsx:93` | تعليق `{/* Mobile Menu Button can be added here */}` بدون تنفيذ | 2 ساعة |
| M-14 | روابط Footer معطلة | `constants.tsx:135-151` | كل الروابط `href: '#'` — لا تقود لأي مكان | 1 ساعة |
| M-15 | لا يوجد تحميل كسول للصور | عام | الصور الخارجية كلها تُحمّل مباشرة | 1 ساعة |
| M-16 | Scroll handler بدون throttle | `About.tsx:14-21` | يُنفذ على كل حدث scroll بدون أي تقييد — يسبب jank | 30 دقيقة |
| M-17 | onClose في useEffect deps | `ProductModal.tsx:62` | `onClose` في dependency array قد يسبب re-render loops إذا لم يكن مستقراً | 15 دقيقة |
| M-18 | CSS مكرر داخل JSX | `ProductModal.tsx:98-103, 279-283` | `<style>` لـ scrollbar CSS معرّف مرتين في نفس الملف | 15 دقيقة |

---

## القسم 5: جودة الكود (Low)

| # | المشكلة | الملف | الوصف |
|---|---------|-------|-------|
| L-01 | ROLE_IMAGES مكرر | `LoginPage.tsx:12-18` + `UserDashboard.tsx:11-17` | نفس الكائن معرّف في ملفين |
| L-02 | `as any` في كل مكان | عام | 40+ استخدام لـ `t(... as any)` — يلغي فائدة TypeScript |
| L-03 | `designSelections` نوعه `any` | `UserDashboard.tsx:164` | `useState<any>({})` بدلاً من نوع واضح |
| L-04 | `details: any` في PaymentMethod | `UserDashboard.tsx:46` | يجب تحديد union type لأنواع الدفع المختلفة |
| L-05 | Product IDs = `Date.now()` | `UserDashboard.tsx:363` | قابل للتصادم وغير مستقر |
| L-06 | أنواع IDs غير متسقة | `types.ts` | Product.id: number, User.id: string, Order.id: string |
| L-07 | SavedDesign.createdAt تخسر نوعها | `App.tsx:44-50` | `JSON.parse` يعيد string وليس Date |
| L-08 | State غير مُستخدم | `UserDashboard.tsx:135-137` | `showTopUpModal`, `topUpAmount`, `selectedPaymentMethodId` معلنة ولا تُستخدم |
| L-09 | `setDressParts` لا يُستخدم | `UserDashboard.tsx:131` | Prop يُمرر من App لكن لا يُستدعى أبداً |
| L-10 | `setOrders` لا يُستخدم | `App.tsx:175` | يُمرر كـ prop لكن لا يتم إنشاء طلبات فعلاً |
| L-11 | Import غير مُستخدم | `types.ts:2` | `import React from 'react'` (لازم فقط لـ `React.ReactNode` في SocialLink) |
| L-12 | Stripe test key مُشفر | `UserDashboard.tsx:8` | `pk_test_TYooMQauvdEDq54NiTphI7jx` — مفتاح تجريبي من Stripe docs |
| L-13 | `index.html` importmap خارجي | `index.html:54-65` | يعتمد على `aistudiocdn.com` و `esm.sh` — قد يتوقف بدون إنذار |
| L-14 | كائن ترجمة غير متزامن | `ar.ts` vs `en.ts` | مفتاح `dashboard_menu_admin_products_subtitle` موجود في العربية فقط |
| L-15 | لا يوجد Error Boundary | عام | أي خطأ في مكون فرعي يسقط التطبيق بالكامل |
| L-16 | لا يوجد Loading states عامة | عام | لا skeleton screens أو loading indicators عند التنقل بين الصفحات |
| L-17 | Accessibility ناقصة | عام | Glass cards ذات نص أبيض على خلفية شفافة — contrast ratio منخفض |
| L-18 | لا يوجد اختبارات | عام | صفر test files في المشروع |

---

## القسم 6: خطة التنفيذ المُقترحة (محدّثة)

### المرحلة 1: الإصلاح الجذري — وقف "تحديث الصفحة" + البنية (الأسبوع 1)
```
الأولوية: P0 — بدون هذه المرحلة لا يمكن استخدام الداشبورد

━━━ الخطوة 1: تفكيك UserDashboard.tsx [CR-03] ━━━
هذا يحل BUG-01 + BUG-02 + BUG-03 + BUG-04 دفعة واحدة.

  استخراج إلى ملفات منفصلة:
  ├── components/dashboard/admin/AdminProducts.tsx    ← يحل BUG-01 (تعديل الأسعار)
  ├── components/dashboard/admin/AdminUsers.tsx       ← يحل BUG-02 + BUG-03 (تعديل/حذف المستخدمين)
  ├── components/dashboard/admin/AdminPayments.tsx    ← يحل BUG-04 (toggle الحوالات)
  ├── components/dashboard/admin/AdminSocials.tsx
  ├── components/dashboard/admin/AdminOrders.tsx
  ├── components/dashboard/admin/AdminApprovals.tsx
  ├── components/dashboard/admin/AdminDesignAssets.tsx ← جديد [BUG-08]
  ├── components/dashboard/admin/AdminCategories.tsx   ← جديد [BUG-09]
  ├── components/dashboard/customer/DesignStudio.tsx
  ├── components/dashboard/customer/MyDesigns.tsx
  ├── components/dashboard/overview/ManagerOverview.tsx
  ├── components/dashboard/DashboardSidebar.tsx
  └── components/dashboard/shared/ (MetricCard, StatusPill, Icon, GlassModal, ConfirmDialog)

━━━ الخطوة 2: مكونات مشتركة ━━━
  - بناء GlassModal.tsx      — مودال موحد بتصميم glass لكل الحوارات
  - بناء ConfirmDialog.tsx    — بديل عن confirm() الأصلي [يحل H-08]
  - بناء ImageInput.tsx       — مكون رفع صور + إدخال URL [يحل BUG-07]

━━━ الخطوة 3: إصلاحات بنيوية ━━━
  - [CR-04] تثبيت Tailwind CSS عبر PostCSS/Vite
  - [CR-01] نقل Gemini API إلى backend proxy
  - [CR-07] إضافة validation للمحفظة
  - [BUG-06] إصلاح أيقونات الحوالات البنكية — SVG محلية + onError fallback
  - [L-01] توحيد ROLE_IMAGES في ملف مشترك
```

### المرحلة 2: إكمال لوحات التحكم + الأعطال المبلغ عنها (الأسبوع 2-3)
```
الأولوية: P1 — الوظائف الأساسية الناقصة + ما طلبه المستخدم

━━━ 2A: إدارة المنتجات [H-01/02/03/04 + BUG-07 + CR-09 + BUG-09] ━━━
  - بناء مودال إضافة/تعديل منتج كامل:
    • حقل الاسم (عربي + إنجليزي)
    • حقل السعر مع validation
    • رفع صورة أو إدخال URL مع معاينة فورية [BUG-07]
    • اختيار المقاسات المتاحة
    • اختيار التصنيف [BUG-09]
    • حقل الوصف
  - تأكيد حذف بمودال glass [H-03]
  - بناء إدارة التصنيفات [CR-09 + BUG-09]:
    • صفحة/قسم لإضافة/تعديل/حذف التصنيفات
    • ربط التصنيف بالمنتجات
    • فلتر في صفحة المتجر حسب التصنيف

━━━ 2B: إدارة المستخدمين [H-06/07/08 + BUG-02/03] ━━━
  - مودال إنشاء مستخدم جديد [H-06]
  - مودال تعديل مستخدم (بدل التعديل المباشر على الجدول)
  - شريط بحث + فلتر بالدور [H-07]
  - استبدال confirm() بـ ConfirmDialog المشترك [H-08 + BUG-03]

━━━ 2C: إعدادات الدفع [H-09/10/11 + BUG-04/05/06] ━━━
  - بناء مودال تكوين لكل نوع طريقة دفع [BUG-05]:
    • حوالة موبايل: رقم الهاتف
    • حوالة مالية: اسم + هاتف + مدينة
    • PayPal: بريد الحساب
    • Stripe: إعدادات المفتاح
    • مركز معتمد: عنوان + دوام
    • بنكي: IBAN + اسم البنك
  - إصلاح أيقونات البنوك [BUG-06]
  - حفظ في localStorage مؤقتاً [H-11]

━━━ 2D: إدارة أصول استوديو التصميم [BUG-08 + M-05] ━━━
  - إضافة "إدارة أصول التصميم" للقائمة الجانبية
  - بناء AdminDesignAssets.tsx:
    • عرض مصنّف بالنوع (tabs: top/bottom/sleeve/fabric/embellishment)
    • مودال إضافة قصة/قماش/زينة جديدة:
      - اختيار النوع
      - الاسم (عربي + إنجليزي)
      - رابط/رفع صورة
      - معاينة فورية
    • تعديل/حذف الأصول الموجودة
    • ربط مع setDressParts [يُنشّط L-09]

━━━ 2E: بقية الإدارة ━━━
  - [H-12/13/14] إصلاح Admin Socials (حفظ فعلي + immutable update + URL validation)
  - [H-15/16/17] إكمال Admin Orders (أزرار إجراء + pagination + فلتر)
  - [H-18/19] إكمال Admin Approvals (أزرار موافقة/رفض)
```

### المرحلة 3: بناء الصفحات الناقصة + الدعم الفني (الأسبوع 3-4)
```
الأولوية: P1-P2

  1. [M-01] بناء صفحة إعدادات الملف الشخصي
  2. [M-02] بناء صفحة المحفظة مع طرق الدفع + StripePaymentForm
  3. [M-03] بناء صفحة طلباتي للزبون
  4. [M-04] بناء صفحة طلبات العملاء للخياط
  5. [M-06] بناء معرض المصمم
  6. [CR-06] إضافة mobile navigation للداشبورد
  7. [BUG-10 — المرحلة 1] إضافة زر WhatsApp/Telegram للدعم الفني:
     - استبدال الرقم الوهمي 123-456-7890 برقم فعلي
     - إضافة زر WhatsApp عائم في كل صفحات الداشبورد
     - إضافة زر "تواصل معنا" في ProductModal وصفحة التواصل
```

### المرحلة 4: تحسينات UX والتدويل (الأسبوع 4-5)
```
الأولوية: P2

  1. [M-07/08/09/10] ترجمة كل النصوص الثابتة
  2. [M-11/12] تحديث معلومات التواصل والـ copyright
  3. [M-13] بناء hamburger menu للموبايل
  4. [M-14] ربط روابط Footer بالتصنيفات الجديدة [CR-09]
  5. [M-15] إضافة lazy loading للصور
  6. [M-16] إضافة throttle لـ scroll handler
  7. [CR-05] إضافة react-router-dom
  8. [CR-08] حفظ البيانات في localStorage
  9. [BUG-10 — المرحلة 2] نظام Chat داخلي (اختياري):
     - ChatWidget.tsx عائم
     - محادثة بين زبون وخياط/دعم
     - WebSocket أو Firebase Realtime Database
```

### المرحلة 5: جودة الكود واختبارات (الأسبوع 5-6)
```
الأولوية: P3

  1. [L-15] إضافة Error Boundary
  2. [L-16] إضافة skeleton loading screens
  3. [L-17] تحسين accessibility و contrast
  4. [L-18] كتابة اختبارات أساسية بـ Vitest + React Testing Library
  5. [L-03/04/05/06] إصلاح types
  6. [L-08/09/10] إزالة dead code
  7. [L-13] استبدال importmap خارجي بـ npm packages عبر Vite bundler
```

---

## القسم 7: ملاحظات فنية إضافية

### هيكل المجلدات المُقترح بعد إعادة الهيكلة:
```
modeyan/
  components/
    layout/
      Header.tsx
      Footer.tsx
      MobileNav.tsx
      WhatsAppButton.tsx          (جديد — BUG-10)
    pages/
      Hero.tsx
      AboutPage.tsx
      ShopPage.tsx                (+ فلتر تصنيفات — BUG-09)
      LoginPage.tsx
      Contact.tsx
    shop/
      ProductCard.tsx
      ProductModal.tsx
      CartSidebar.tsx
      CategoryFilter.tsx          (جديد — BUG-09)
    dashboard/
      UserDashboard.tsx           (shell + router فقط — بعد التفكيك)
      DashboardSidebar.tsx
      DashboardMobileNav.tsx
      overview/
        ManagerOverview.tsx
        CustomerOverview.tsx
      admin/
        AdminProducts.tsx         (+ مودال إضافة/تعديل — BUG-01/07)
        AdminUsers.tsx            (+ مودال تعديل — BUG-02/03)
        AdminPayments.tsx         (+ مودال تكوين — BUG-04/05)
        AdminSocials.tsx
        AdminOrders.tsx
        AdminApprovals.tsx
        AdminDesignAssets.tsx     (جديد — BUG-08)
        AdminCategories.tsx       (جديد — BUG-09/CR-09)
      customer/
        DesignStudio.tsx
        MyDesigns.tsx
        CustomerOrders.tsx
        SendToTailorModal.tsx
      professional/
        Portfolio.tsx
        TailorRequests.tsx
      shared/
        MetricCard.tsx
        StatusPill.tsx
        Icon.tsx
        GlassModal.tsx            (جديد — مودال موحد)
        ConfirmDialog.tsx         (جديد — بديل confirm())
        ImageInput.tsx            (جديد — رفع صور + URL — BUG-07)
        ChatWidget.tsx            (جديد — BUG-10 مرحلة 2)
      profile/
        ProfileSettings.tsx
        Wallet.tsx
  contexts/
    LanguageContext.tsx
    AuthContext.tsx                (جديد)
    DashboardContext.tsx           (جديد)
  hooks/
    useTranslation.ts
    useAuth.ts                    (جديد)
  constants/
    index.ts
    roleImages.ts                 (جديد — موحد من LoginPage + UserDashboard)
    bankIcons.tsx                  (جديد — SVG أيقونات بنوك محلية — BUG-06)
  translations/
    en.ts                         (+ مفاتيح التصنيفات والأصول الجديدة)
    ar.ts                         (+ مفاتيح التصنيفات والأصول الجديدة)
  types/
    index.ts
    product.ts                    (+ categoryId — CR-09)
    category.ts                   (جديد — BUG-09)
    user.ts
    order.ts
    design.ts
  styles/
    globals.css                   (Tailwind directives + scrollbar CSS موحد)
```

### مقاييس الجودة المطلوبة:
- **TypeScript strict:** صفر `as any` في الكود النهائي
- **ترجمة:** كل نص مرئي يمر عبر `t()` — صفر نصوص ثابتة
- **Accessibility:** WCAG 2.1 AA — contrast ratio 4.5:1 minimum
- **Mobile:** كل الصفحات قابلة للاستخدام على شاشات 320px+
- **Performance:** Lighthouse score > 80 على كل المحاور

---

## القسم 8: جدول ربط الأعطال بالإصلاحات

| العطل المُبلغ عنه | الرقم | السبب الجذري | يُحل في المرحلة | الإصلاح |
|---|---|---|---|---|
| تعديل الأسعار يحدّث الصفحة | BUG-01 | CR-03 (مكونات داخلية) | المرحلة 1 | استخراج AdminProducts + مودال تعديل |
| تعديل الأسماء يحدّث الصفحة | BUG-02 | CR-03 | المرحلة 1 | استخراج AdminUsers + مودال تعديل |
| حذف مستخدم يحدّث الصفحة | BUG-03 | CR-03 + confirm() | المرحلة 1 | استخراج + ConfirmDialog |
| toggle الحوالات يحدّث الصفحة | BUG-04 | CR-03 | المرحلة 1 | استخراج AdminPayments |
| زر إعدادات لا يعمل | BUG-05 | onClick مفقود | المرحلة 2 | مودال تكوين كامل |
| صور البنوك مفقودة | BUG-06 | روابط flaticon معطلة | المرحلة 1 | SVG محلية + fallback |
| إضافة منتج بصورة | BUG-07 | لا يوجد مودال | المرحلة 2 | مودال + ImageInput |
| إضافة قصات للاستوديو | BUG-08 | صفحة غير مُنفّذة | المرحلة 2 | AdminDesignAssets كامل |
| إضافة تصنيفات | BUG-09 | لا يوجد نظام تصنيف | المرحلة 2 | Category model + admin UI + shop filter |
| الدعم الفني/المحادثة | BUG-10 | غير مُنفّذ | المرحلة 3 (سريع) / 4 (كامل) | WhatsApp → Chat داخلي |

---

## الخلاصة

المشروع يملك أساس جيد من ناحية التصميم البصري والفكرة. لكنه حالياً **نموذج أولي (prototype)** وليس تطبيقاً جاهزاً للإنتاج.

**المشكلة الأخطر والأكثر تأثيراً:** تعريف المكونات الفرعية داخل `UserDashboard` (CR-03) — هذا وحده يسبب 4 من أصل 10 أعطال أبلغ عنها المستخدم (BUG-01 إلى BUG-04). إصلاحه الجذري (استخراج المكونات إلى ملفات مستقلة) يحل كل مشاكل "الصفحة تتحدث" دفعة واحدة.

لوحات التحكم الإدارية هي الأكثر تأثراً — معظمها يعرض البيانات بدون إمكانية التعديل الفعلي، وعدة أزرار موجودة لكنها بدون وظائف مربوطة.

**إجمالي الجهد المقدّر:** 100-140 ساعة عمل (5-7 أسابيع لمطوّر واحد)

| المرحلة | المدة | عدد الأعطال المحلولة |
|---|---|---|
| المرحلة 1: الإصلاح الجذري | أسبوع 1 | BUG-01, 02, 03, 04, 06 + CR-01,03,04,07 |
| المرحلة 2: لوحات التحكم | أسبوع 2-3 | BUG-05, 07, 08, 09 + H-01→19 |
| المرحلة 3: صفحات ناقصة | أسبوع 3-4 | BUG-10 + M-01→06 |
| المرحلة 4: UX وتدويل | أسبوع 4-5 | M-07→18 + CR-05,08 |
| المرحلة 5: جودة واختبارات | أسبوع 5-6 | L-01→18 |
