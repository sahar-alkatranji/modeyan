# MODEYA - Implementation Plan 02
# خطة الإصلاحات الثانية - أعطال مُبلغ عنها من العميل (سحر القطرنجي)

> **المشروع:** MODEYA - Fashion Boutique  
> **التاريخ:** 2026-05-21  
> **المرجع:** تابع لـ ImplementationPlan.md (الخطة الأولى)  
> **المصدر:** رسائل العميل بتاريخ 21/05/2026 الساعة 2:49 - 3:01 PM  

---

## الملخص التنفيذي

6 أعطال جديدة مُبلغ عنها من العميل (سحر القطرنجي)، بعضها يتقاطع مع مشاكل وُثقت في الخطة الأولى (CR-03). تم تحليل كل عطل مع تحديد السبب الجذري والملفات المتأثرة والحل المقترح.

| # | العطل | الخطورة | الجهد | يتقاطع مع الخطة 1 |
|---|-------|---------|-------|-------------------|
| NB-01 | رفع الصور يتطلب رابط URL فقط | عالية | 6-8 ساعات | جديد |
| NB-02 | واجهة الزبون نفس واجهة المدير | حرجة | 2-3 ساعات | CR-03 جزئياً |
| NB-03 | أيقونات حوالة بنكية غير موجودة | متوسطة | 1-2 ساعة | BUG-09 |
| NB-04 | محادثة بين الخياطة والزبون غير موجودة | عالية | 12-16 ساعة | BUG-10 |
| NB-05 | صفحة المصمم تتحدث عند الكتابة | حرجة | 3-4 ساعات | CR-03 |
| NB-06 | صفحة الخياطة نفس المشكلة | حرجة | 3-4 ساعات | CR-03 |

---

## NB-01: رفع الصور يتطلب رابط URL فقط - لا يمكن رفع صورة من الجهاز

### وصف العطل
> "وقت بدي ضيف عمل جديد وارفعلو صورة جديدة بدو حصرا رابط بركي انا كان بدي الصورة مثلا من سطح المكتب او صورة من موبايل ما بقدر"

### الملفات المتأثرة
- `components/UserDashboard.tsx:469-514` (AdminProducts)
- `components/UserDashboard.tsx:757-785` (ProfessionalPortfolio)
- `services/api.ts` (لا يوجد endpoint لرفع الملفات)

### السبب الجذري
لا يوجد في المشروع بأكمله أي آلية لرفع الملفات (File Upload). جميع الصور تُدخل كروابط URL:

1. **AdminProducts** (سطر 478-484): عند إضافة منتج جديد، يُعطى صورة placeholder ثابتة:
   ```tsx
   imageUrls: ['https://placehold.co/400x600?text=New+Product']
   ```
   لا يوجد حقل لتغيير الصورة أو رفعها.

2. **ProfessionalPortfolio** (سطر 764): زر "إضافة عمل جديد" لا يحتوي حتى على `onClick` handler:
   ```tsx
   <button className="...">
       {t('tailor_portfolio_add_button')}
   </button>
   ```
   الزر لا يفعل شيئاً.

3. **API Client** (`services/api.ts`): كل الطلبات تستخدم `Content-Type: application/json` فقط. لا يوجد `multipart/form-data` لرفع الملفات.

### الحل المقترح

#### الخطوة 1: إضافة endpoint رفع ملفات في API Client
```typescript
// services/api.ts - إضافة method جديدة
async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${this.token}`,
            // لا نضع Content-Type - المتصفح يضبطه تلقائياً مع FormData
        },
        body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
}
```

#### الخطوة 2: إنشاء مكون ImageUpload قابل لإعادة الاستخدام
```typescript
// components/shared/ImageUpload.tsx
interface ImageUploadProps {
    currentUrl?: string;
    onImageChange: (url: string) => void;
    accept?: string;
}
```
المكون يجب أن يدعم:
- سحب وإفلات (Drag & Drop)
- اختيار ملف من الجهاز
- معاينة الصورة قبل الرفع
- إدخال URL يدوي كبديل
- عرض مؤشر تحميل أثناء الرفع

#### الخطوة 3: تحديث AdminProducts
- إضافة modal لإنشاء/تعديل المنتج يحتوي على ImageUpload
- ربط حقل الصورة مع api.uploadImage

#### الخطوة 4: تحديث ProfessionalPortfolio
- إضافة onClick handler لزر "إضافة عمل"
- عرض modal/form مع ImageUpload لرفع صور العمل
- ربطه مع api.createPortfolioItem

#### الخطوة 5: Backend
- إنشاء endpoint `POST /api/v1/upload` يقبل `multipart/form-data`
- تخزين الصور في مجلد `uploads/` أو خدمة تخزين سحابي (S3/Cloudinary)
- إرجاع URL الصورة المرفوعة

### الأولوية: P1 (عالية)
### الجهد المقدر: 6-8 ساعات (Frontend + Backend)

---

## NB-02: واجهة الزبون نفس واجهة المدير

### وصف العطل
> "عند تسجيل دخول كزبون واجهة نفسها تبعيت مدير"

### الملفات المتأثرة
- `components/UserDashboard.tsx:920` (عرض Overview)
- `components/UserDashboard.tsx:601-670` (ManagerOverview component)

### السبب الجذري
في سطر 920 من UserDashboard.tsx، يُعرض ManagerOverview لجميع الأدوار بدون تفريق:

```tsx
{currentView === 'overview' && <ManagerOverview />}
```

المكون `ManagerOverview` يحتوي على:
- إحصائيات إدارية (عدد المستخدمين، إجمالي الإيرادات)
- أزرار التنقل لإدارة المنتجات والسوشال ميديا
- قائمة الموافقات المعلقة
- الطلبات الأخيرة مع تفاصيل إدارية

**القائمة الجانبية (Sidebar)** تعمل بشكل صحيح وتُخفي عناصر الإدارة عن الزبون (سطور 856-884)، لكن صفحة Overview الرئيسية هي نفسها للجميع.

### الحل المقترح

#### إنشاء Overview مختلف لكل دور:

```tsx
// بدلاً من:
{currentView === 'overview' && <ManagerOverview />}

// يجب أن يكون:
{currentView === 'overview' && userRole === 'manager' && <ManagerOverview />}
{currentView === 'overview' && userRole === 'customer' && <CustomerOverview />}
{currentView === 'overview' && userRole === 'designer' && <DesignerOverview />}
{currentView === 'overview' && userRole === 'tailor' && <TailorOverview />}
```

#### محتوى كل Overview:

**CustomerOverview** يجب أن يعرض:
- رسالة ترحيب بالاسم
- آخر الطلبات الشخصية
- التصاميم المحفوظة
- رصيد المحفظة
- زر "ابدأ تصميمك" للانتقال إلى Design Studio

**DesignerOverview** يجب أن يعرض:
- ملخص أعمال Portfolio
- حالة الأعمال المعلقة (pending/approved/rejected)
- الطلبات الواردة
- رابط سريع لإضافة عمل جديد

**TailorOverview** يجب أن يعرض:
- الطلبات الجديدة (pending_quote)
- الطلبات قيد التنفيذ (in_progress)
- أعمال Portfolio مع حالتها
- إحصائيات الأداء

### الأولوية: P0 (حرجة - كل الزبائن يرون لوحة المدير)
### الجهد المقدر: 2-3 ساعات

---

## NB-03: أيقونات حوالة بنكية غير موجودة

### وصف العطل
> "عند دفع ايقونات حوالة بنكية مو موجودين"

### الملفات المتأثرة
- `components/UserDashboard.tsx:168-170` (paymentMethods state)
- `components/UserDashboard.tsx:715-755` (AdminPayments component)
- `components/UserDashboard.tsx:932-955` (Wallet view)

### السبب الجذري
ثلاثة أسباب مجتمعة:

1. **طريقتا الدفع البنكية معطلتان افتراضياً** (سطور 168-170):
   ```tsx
   { id: 'bank_transfer', ..., isActive: false, imgUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png', ... },
   { id: 'baraka', ..., isActive: false, imgUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830289.png', ... },
   ```
   كلاهما `isActive: false` مما يجعلهما بشفافية 60% و grayscale (سطر 723):
   ```tsx
   className={`... ${method.isActive ? 'border-brand-gold/20' : 'border-white/10 grayscale opacity-60'}`}
   ```

2. **روابط الأيقونات من Flaticon قد تكون محظورة أو معطلة**: CDN الخاص بـ flaticon.com قد يحتاج referrer صحيح أو تحميل الأيقونات مسبقاً.

3. **العرض في Wallet مفقود**: صفحة Wallet (سطور 932-955) لا تعرض طرق الدفع المتاحة أصلاً - تعرض فقط الرصيد وحقل الشحن. الزبون لا يرى أيقونات البنك لأنها تظهر فقط في لوحة المدير (AdminPayments).

### الحل المقترح

1. **تضمين أيقونات البنك محلياً**: تنزيل أيقونات SVG لـ bank transfer و baraka bank وحفظها في `public/icons/`:
   ```
   public/icons/bank-transfer.svg
   public/icons/baraka-bank.svg
   ```
   واستخدام مسارات محلية بدل CDN:
   ```tsx
   imgUrl: '/icons/bank-transfer.svg'
   ```

2. **عرض طرق الدفع في صفحة Wallet**: إضافة قسم يعرض طرق الدفع النشطة مع أيقوناتها في صفحة المحفظة.

3. **تفعيل البنك افتراضياً أو إضافة UX واضح**: إذا كانت طريقة دفع معطلة، يجب أن يكون واضحاً للمدير كيف يفعّلها.

### الأولوية: P2 (متوسطة)
### الجهد المقدر: 1-2 ساعة

---

## NB-04: محادثة بين الخياطة والزبون غير موجودة

### وصف العطل
> "محادثة بين الخياطة والزبون"

### الملفات المتأثرة
- `types.ts:78-83` (ChatMessage interface - موجود لكن غير مستخدم)
- `types.ts:94` (Order.chatHistory - معرّف لكن غير مستخدم)
- `components/UserDashboard.tsx` (لا يوجد أي مكون chat)
- `services/api.ts` (لا يوجد أي endpoint للمحادثة)

### السبب الجذري
ميزة المحادثة **غير منفذة بالكامل**. يوجد فقط تعريف TypeScript للأنواع:

```typescript
// types.ts
export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface Order {
    // ...
    chatHistory?: ChatMessage[];
}
```

لكن لا يوجد:
- مكون UI للمحادثة
- API endpoints لإرسال/استقبال الرسائل
- Real-time messaging (WebSocket/polling)
- إشعارات الرسائل الجديدة

### الحل المقترح

#### المرحلة 1: واجهة المحادثة (Frontend)

إنشاء `components/dashboard/ChatPanel.tsx`:
```typescript
interface ChatPanelProps {
    orderId: string;
    currentUserId: string;
    otherUserName: string;
}
```

الميزات المطلوبة:
- عرض سلسلة الرسائل مع فقاعات (bubbles) مختلفة للمرسل والمستقبل
- حقل إدخال نص مع زر إرسال
- عرض الطابع الزمني لكل رسالة
- التمرير التلقائي لآخر رسالة
- مؤشر "يكتب..." (اختياري)

#### المرحلة 2: API Endpoints

```typescript
// services/api.ts - endpoints جديدة
async getOrderMessages(orderId: number): Promise<ChatMessage[]>
async sendMessage(orderId: number, text: string): Promise<ChatMessage>
```

#### المرحلة 3: ربط المحادثة بالطلبات

- إضافة زر "محادثة" في كل طلب (Order row)
- فتح ChatPanel كـ modal أو panel جانبي
- عرض عدد الرسائل غير المقروءة

#### المرحلة 4: Real-time (اختياري - يمكن البدء بـ Polling)

الخيارات:
- **Polling بسيط**: `setInterval` كل 5 ثوان لجلب الرسائل الجديدة (أبسط حل)
- **WebSocket**: اتصال دائم لتحديثات فورية (أفضل تجربة)
- **Server-Sent Events**: بديل وسط

### الأولوية: P1 (عالية - ميزة أساسية لسير العمل)
### الجهد المقدر: 12-16 ساعة (Frontend + Backend)

---

## NB-05: صفحة المصمم تتحدث بالكامل عند الكتابة

### وصف العطل
> "عند تسجيل دخول كمصمم كمان اي شي بكتبو بالصفحة بتتحدث كل الصفحة"

### الملفات المتأثرة
- `components/UserDashboard.tsx` (الملف بأكمله - 1105 سطر)

### السبب الجذري
**نفس المشكلة الموثقة في الخطة الأولى (CR-03)**: جميع المكونات الفرعية (ProfessionalPortfolio, DesignStudio, إلخ) مُعرَّفة كـ arrow functions **داخل** مكون UserDashboard.

عند دخول المصمم، يُعرض مثلاً `ProfessionalPortfolio` (سطر 757). هذا المكون مُعرَّف داخل UserDashboard:

```tsx
const UserDashboard = ({ ... }) => {
    // ... state definitions ...
    
    const ProfessionalPortfolio = () => (  // يُعاد إنشاؤه كل render!
        <div>...</div>
    );
    
    return (
        // ...
        {currentView === 'portfolio' && <ProfessionalPortfolio />}
    );
};
```

أي تغيير في أي state في UserDashboard (حتى state غير متعلقة بالمكون المعروض) يؤدي إلى:
1. إعادة render لـ UserDashboard
2. إعادة تعريف ProfessionalPortfolio كـ function جديدة
3. React يعتبرها مكون مختلف (مرجع function مختلف)
4. React يفك (unmount) المكون القديم ويركّب (mount) الجديد
5. **فقدان كل state داخلي بما فيه محتوى حقول الإدخال**

### مثال عملي للمشكلة

عندما المصمم يكتب في حقل إدخال (مثلاً في Profile):
1. `onChange` يُحدّث state
2. UserDashboard يعمل re-render
3. جميع المكونات الداخلية تُعاد تعريفها
4. المكون الحالي يُلغى ويُنشأ من جديد
5. حقل الإدخال يفقد focus والقيمة المكتوبة
6. يبدو كأن "الصفحة تتحدث"

### الحل
**نفس الحل من CR-03 في الخطة الأولى**: استخراج كل المكونات الفرعية إلى ملفات منفصلة:

```
components/dashboard/
├── ManagerOverview.tsx
├── CustomerOverview.tsx      (جديد - NB-02)
├── DesignerOverview.tsx      (جديد - NB-02)
├── TailorOverview.tsx        (جديد - NB-02)
├── DesignStudio.tsx
├── AdminProducts.tsx
├── AdminUsers.tsx
├── AdminPayments.tsx
├── AdminSocials.tsx
├── AdminOrders.tsx
├── ProfessionalPortfolio.tsx
├── MyDesigns.tsx
├── ChatPanel.tsx             (جديد - NB-04)
├── CustomerOrders.tsx
├── TailorRequests.tsx
├── WalletView.tsx
├── ProfileView.tsx
└── shared/
    ├── StatusPill.tsx
    ├── MetricCard.tsx
    ├── SidebarItem.tsx
    ├── Icon.tsx
    └── ImageUpload.tsx       (جديد - NB-01)
```

كل مكون يُصدَّر كـ named export ويستقبل props بدلاً من الاعتماد على closure:

```tsx
// components/dashboard/ProfessionalPortfolio.tsx
interface ProfessionalPortfolioProps {
    portfolioItems: PortfolioItem[];
    setPortfolioItems: React.Dispatch<...>;
    t: (key: string) => string;
}

const ProfessionalPortfolio: React.FC<ProfessionalPortfolioProps> = ({ ... }) => {
    // ...
};

export default ProfessionalPortfolio;
```

### الأولوية: P0 (حرجة - يمنع الاستخدام الأساسي)
### الجهد المقدر: 3-4 ساعات
### ملاحظة: هذا الإصلاح يحل NB-06 أيضاً

---

## NB-06: صفحة الخياطة نفس مشكلة التحديث

### وصف العطل
> "حتى عند الخياطة"

### السبب الجذري
**نفس السبب تماماً كـ NB-05** - المكونات المعروضة لدور الخياط (portfolio, requests) مُعرَّفة داخل UserDashboard.

### الحل
**يُحل تلقائياً مع إصلاح NB-05** (استخراج المكونات).

### الأولوية: P0
### الجهد: مشمول في NB-05

---

## ملخص العلاقة مع الخطة الأولى

| عطل جديد | مشكلة في الخطة 1 | العلاقة |
|-----------|------------------|---------|
| NB-01 (رفع صور) | جديد | لم يُوثق سابقاً - ميزة مفقودة بالكامل |
| NB-02 (واجهة الزبون = المدير) | CR-03 جزئياً | السبب: لا يوجد overview مخصص لكل دور |
| NB-03 (أيقونات بنك) | BUG-09 | نفس المشكلة - أيقونات مفقودة + طرق دفع معطلة |
| NB-04 (محادثة) | BUG-10 | نفس المشكلة - ميزة غير منفذة |
| NB-05 (تحديث صفحة المصمم) | CR-03 | نفس السبب الجذري - مكونات مُعرَّفة داخل parent |
| NB-06 (تحديث صفحة الخياطة) | CR-03 | نفس السبب الجذري |

---

## خطة التنفيذ المقترحة

### المرحلة 1: إصلاحات حرجة (الأسبوع 1) - 8-11 ساعة
1. **NB-05 + NB-06**: استخراج المكونات من UserDashboard (3-4 ساعات)
   - هذا يحل مشكلة التحديث لجميع الأدوار
   - يجعل الكود أسهل صيانة لبقية الإصلاحات
2. **NB-02**: إنشاء Overview مختلف لكل دور (2-3 ساعات)
   - CustomerOverview, DesignerOverview, TailorOverview
3. **NB-03**: إصلاح أيقونات البنك (1-2 ساعة)
   - تنزيل أيقونات محلية + إضافة عرض طرق الدفع في Wallet

### المرحلة 2: ميزات جديدة (الأسبوعين 2-3) - 18-24 ساعة
4. **NB-01**: نظام رفع الصور (6-8 ساعات)
   - Backend: endpoint رفع ملفات
   - Frontend: مكون ImageUpload + تحديث AdminProducts و Portfolio
5. **NB-04**: نظام المحادثة (12-16 ساعة)
   - Backend: API المحادثة
   - Frontend: ChatPanel + ربطه بالطلبات

### إجمالي الجهد المقدر: 26-35 ساعة عمل

---

## ملاحظات تقنية

### لماذا يجب البدء بـ NB-05/NB-06 أولاً؟
استخراج المكونات هو **شرط مسبق** لبقية الإصلاحات:
- بدون الاستخراج، أي إضافة state جديدة (مثل chat أو file upload) ستزيد مشكلة التحديث
- بعد الاستخراج، كل مكون يدير state مستقل بدون تأثير على البقية
- الكود يصبح أسهل للفهم والتعديل

### متطلبات Backend
الأعطال NB-01 و NB-04 تتطلب عمل على الـ Backend:
- `POST /api/v1/upload` - رفع ملفات
- `GET /api/v1/orders/:id/messages` - جلب رسائل
- `POST /api/v1/orders/:id/messages` - إرسال رسالة
- تخزين الملفات المرفوعة (filesystem أو cloud storage)
