# MODEYA - Implementation Plan 02
# خطة الإصلاحات الثانية - أعطال مُبلغ عنها من العميل (سحر القطرنجي)

> **المشروع:** MODEYA - Fashion Boutique  
> **التاريخ:** 2026-05-21  
> **المرجع:** تابع لـ ImplementationPlan.md (الخطة الأولى)  
> **المصدر:** رسائل العميل بتاريخ 21/05/2026 الساعة 2:49 - 3:01 PM + 3:06 - 3:20 PM  

---

## الملخص التنفيذي

13 عطل/طلب مُبلغ عنها من العميل (سحر القطرنجي) على دفعتين، بعضها يتقاطع مع مشاكل وُثقت في الخطة الأولى (CR-03). تم تحليل كل عطل مع تحديد السبب الجذري والملفات المتأثرة والحل المقترح.

### الدفعة الأولى (2:49 - 3:01 PM)

| # | العطل | الخطورة | الجهد | يتقاطع مع الخطة 1 |
|---|-------|---------|-------|-------------------|
| NB-01 | رفع الصور يتطلب رابط URL فقط | عالية | 6-8 ساعات | جديد |
| NB-02 | واجهة الزبون نفس واجهة المدير | حرجة | 2-3 ساعات | CR-03 جزئياً |
| NB-03 | أيقونات حوالة بنكية غير موجودة | متوسطة | 1-2 ساعة | BUG-09 |
| NB-04 | محادثة بين الخياطة والزبون غير موجودة | عالية | 12-16 ساعة | BUG-10 |
| NB-05 | صفحة المصمم تتحدث عند الكتابة | حرجة | 3-4 ساعات | CR-03 |
| NB-06 | صفحة الخياطة نفس المشكلة | حرجة | 3-4 ساعات | CR-03 |

### الدفعة الثانية (3:06 - 3:20 PM)

| # | العطل | الخطورة | الجهد | يتقاطع مع الخطة 1 |
|---|-------|---------|-------|-------------------|
| NB-07 | استبدال تصنيفات الـ Footer (بلوزات/تنانير/أحذية/سترات → تصنيفات فساتين) | منخفضة | 30 دقيقة | M-11 جزئياً |
| NB-08 | المصممة تقدر تضيف فيديو للتصميم | عالية | 4-6 ساعات | جديد |
| NB-09 | إضافة سياسات شحن للفساتين | متوسطة | 2-3 ساعات | جديد |
| NB-10 | استبدال إيميل info@mysite.com بإيميل الموقع الحقيقي | منخفضة | 15 دقيقة | M-11 |
| NB-11 | زر تخصيص المقاس → صفحة الخياطة + حل مشكلة التحديث عند الكتابة | حرجة | 2-3 ساعات | CR-03 / NB-05 |
| NB-12 | إضافة تعليق وتقييم من نافذة "نظرة سريعة" | عالية | 4-5 ساعات | جديد |
| NB-13 | صورة البنت في الموقع - الوجه مش باين | منخفضة | 10 دقائق | جديد |

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
### ملاحظة: هذا الإصلاح يحل NB-06 و NB-11 (جزء التحديث) أيضاً

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

## NB-07: استبدال تصنيفات المتجر في الـ Footer

### وصف العطل
> "في الصفحة الرئيسة وقت بنزل لاخر الصفحة في المتجر بدي احذف (بلوزات تنانير احذية سترات) بدي استبدلا بتصنيفات الفساتين متل طويل قصير صيفي شتوي ربيعي خريفي"

### الملفات المتأثرة
- `constants.tsx:133-140` (FOOTER_LINKS.shop)
- `translations/ar.ts:446-451` (ترجمات footer_shop_*)
- `translations/en.ts:445-450` (ترجمات footer_shop_*)
- `components/Footer.tsx:31-38` (عرض روابط المتجر)

### السبب الجذري
التصنيفات الحالية في `FOOTER_LINKS.shop` هي تصنيفات ملابس عامة لا تتناسب مع طبيعة الموقع (متجر فساتين حصرياً):

```tsx
// constants.tsx:134-140
shop: [
    { key: 'footer_shop_dresses', href: '#' },   // ✅ يبقى
    { key: 'footer_shop_tops', href: '#' },       // ❌ بلوزات - حذف
    { key: 'footer_shop_skirts', href: '#' },     // ❌ تنانير - حذف
    { key: 'footer_shop_jackets', href: '#' },    // ❌ سترات - حذف
    { key: 'footer_shop_shoes', href: '#' },      // ❌ أحذية - حذف
],
```

الترجمات الموجودة:
- **عربي**: `footer_shop_tops: 'بلوزات'`, `footer_shop_skirts: 'تنانير'`, `footer_shop_jackets: 'سترات'`, `footer_shop_shoes: 'أحذية'`
- **إنجليزي**: `footer_shop_tops: 'Tops'`, `footer_shop_skirts: 'Skirts'`, `footer_shop_jackets: 'Jackets'`, `footer_shop_shoes: 'Shoes'`

### الحل المقترح

#### الخطوة 1: تحديث FOOTER_LINKS في constants.tsx
```tsx
shop: [
    { key: 'footer_shop_long', href: '#' },
    { key: 'footer_shop_short', href: '#' },
    { key: 'footer_shop_summer', href: '#' },
    { key: 'footer_shop_winter', href: '#' },
    { key: 'footer_shop_spring', href: '#' },
    { key: 'footer_shop_autumn', href: '#' },
],
```

#### الخطوة 2: تحديث الترجمات
```typescript
// translations/ar.ts - استبدال المفاتيح القديمة
footer_shop_long: 'فساتين طويلة',
footer_shop_short: 'فساتين قصيرة',
footer_shop_summer: 'فساتين صيفية',
footer_shop_winter: 'فساتين شتوية',
footer_shop_spring: 'فساتين ربيعية',
footer_shop_autumn: 'فساتين خريفية',

// translations/en.ts
footer_shop_long: 'Long Dresses',
footer_shop_short: 'Short Dresses',
footer_shop_summer: 'Summer Dresses',
footer_shop_winter: 'Winter Dresses',
footer_shop_spring: 'Spring Dresses',
footer_shop_autumn: 'Autumn Dresses',
```

#### الخطوة 3 (اختياري): ربط التصنيفات بفلتر في صفحة المتجر
- إضافة خاصية `category` لـ Product type
- عند الضغط على تصنيف في الـ Footer → الانتقال لصفحة المتجر مع فلتر مُطبّق

### الأولوية: P3 (منخفضة - تحسين تجربة)
### الجهد المقدر: 30 دقيقة

---

## NB-08: المصممة تقدر تضيف فيديو للتصميم

### وصف العطل
> "المصممة تقدر ضيف فيديو هي مصممتو للتصميم"

### الملفات المتأثرة
- `types.ts:99-108` (PortfolioItem interface)
- `components/UserDashboard.tsx:757-785` (ProfessionalPortfolio)
- `services/api.ts` (portfolio endpoints)

### السبب الجذري
واجهة `PortfolioItem` تدعم فقط `imageUrls: string[]` ولا يوجد حقل للفيديو:

```typescript
// types.ts:99-108
export interface PortfolioItem {
    id: string;
    tailorId: string;
    title: string;
    description: string;
    price: number;
    imageUrls: string[];     // صور فقط - لا دعم فيديو
    status: 'pending' | 'approved' | 'rejected';
    stock?: { size: string, quantity: number }[];
}
```

كذلك مكون `ProfessionalPortfolio` (سطر 768-784) يعرض فقط الصورة الأولى من `imageUrls`:
```tsx
<img src={item.imageUrls[0]} alt={...} className="..." />
```

لا يوجد أي مكان لرفع فيديو أو عرضه.

### الحل المقترح

#### الخطوة 1: تحديث PortfolioItem Type
```typescript
export interface PortfolioItem {
    // ... الحقول الحالية
    imageUrls: string[];
    videoUrl?: string;          // ← جديد: رابط فيديو اختياري
    videoThumbnail?: string;    // ← جديد: صورة مصغرة للفيديو
}
```

#### الخطوة 2: إضافة مكون VideoUpload
إنشاء `components/shared/VideoUpload.tsx`:
- رفع فيديو من الجهاز (mp4, webm, mov)
- عرض معاينة الفيديو مع controls
- حد أقصى لحجم الملف (مثلاً 100MB)
- عرض شريط تقدم أثناء الرفع

#### الخطوة 3: تحديث ProfessionalPortfolio
- إضافة حقل فيديو في modal إضافة/تعديل العمل
- عرض أيقونة ▶️ على البطاقة إذا كان العمل يحتوي فيديو
- تشغيل الفيديو في modal منفصل عند الضغط

#### الخطوة 4: تحديث واجهة عرض المنتجات
- في صفحة المنتج (ProductModal)، إذا كان المنتج مرتبط بعمل portfolio فيه فيديو → عرض الفيديو بجانب الصور

#### الخطوة 5: Backend
- تحديث endpoint `POST /api/v1/upload` لقبول ملفات فيديو
- إضافة حقل `video_url` في جدول portfolio_items
- ضغط/تحويل الفيديو إذا لزم الأمر (ffmpeg)

### الأولوية: P1 (عالية - ميزة مطلوبة من العميل)
### الجهد المقدر: 4-6 ساعات (Frontend + Backend)

---

## NB-09: إضافة سياسات شحن للفساتين

### وصف العطل
> "بدي ضيف سياسات للشحن القطع الفساتين"

### الملفات المتأثرة
- `constants.tsx:146-151` (FOOTER_LINKS.policy - الروابط موجودة لكن بدون محتوى)
- `components/Footer.tsx:53-61` (عرض روابط السياسات)
- **لا يوجد** مكون أو صفحة لعرض محتوى السياسات

### السبب الجذري
روابط السياسات موجودة في الـ Footer لكنها جميعها تشير إلى `href: '#'`:

```tsx
// constants.tsx:146-151
policy: [
    { key: 'footer_policy_shipping', href: '#' },  // الشحن والإرجاع
    { key: 'footer_policy_store', href: '#' },      // سياسة المتجر
    { key: 'footer_policy_payment', href: '#' },    // طرق الدفع
    { key: 'footer_policy_faq', href: '#' },        // الأسئلة الشائعة
],
```

لا يوجد:
- صفحة سياسات مخصصة
- نظام routing لعرض محتوى السياسة
- محتوى نصي للسياسات

### الحل المقترح

#### الخطوة 1: إنشاء مكون PolicyPage
```typescript
// components/PolicyPage.tsx
interface PolicyPageProps {
    policyType: 'shipping' | 'store' | 'payment' | 'faq';
    onNavigate: (page: Page) => void;
}
```

#### الخطوة 2: إضافة محتوى السياسات
إنشاء محتوى لكل سياسة (يتم الحصول عليه من العميل أو إنشاء نموذج أولي):

**سياسة الشحن** تتضمن:
- مناطق الشحن المتاحة
- مدة التوصيل لكل منطقة
- تكاليف الشحن
- شروط الإرجاع والاستبدال للفساتين
- العناية بالمنتجات أثناء الشحن

**سياسة المتجر** تتضمن:
- شروط الاستخدام
- سياسة الخصوصية
- حقوق الملكية الفكرية

**طرق الدفع** تتضمن:
- طرق الدفع المقبولة
- سياسة الاسترداد

**الأسئلة الشائعة** تتضمن:
- أسئلة عن المقاسات والتخصيص
- أسئلة عن الشحن والتوصيل
- أسئلة عن الدفع والاسترداد

#### الخطوة 3: تحديث الـ Router
- إضافة `'policy'` كـ Page type في App.tsx
- ربط روابط الـ Footer بالتنقل إلى PolicyPage مع النوع المحدد

#### الخطوة 4: إضافة الترجمات
- إضافة مفاتيح ترجمة لكل محتوى سياسة (عربي + إنجليزي)

### الأولوية: P2 (متوسطة - مطلوب قانونياً وتجارياً)
### الجهد المقدر: 2-3 ساعات

> **ملاحظة**: يجب الحصول من العميل على النصوص الدقيقة لسياسات الشحن الخاصة بمتجرها

---

## NB-10: استبدال إيميل info@mysite.com بإيميل الموقع الحقيقي

### وصف العطل
> "عند متجرنا لازم احذف هاد ايميل info@mysite.com واستبدلو بايميل موقعنا"

### الملفات المتأثرة (4 مواقع)
1. `components/Footer.tsx:43` → `<p className="mb-2">info@mysite.com</p>`
2. `translations/ar.ts:55` → `contact_info: 'info@mysite.com | هاتف: 123-456-7890'`
3. `translations/en.ts:55` → `contact_info: 'info@mysite.com | Tel: 123-456-7890'`
4. `components/Footer.tsx:42` → `<p className="mb-2">123-456-7890</p>` (رقم هاتف وهمي أيضاً)
5. `components/Footer.tsx:44` → `<p className="mb-4">123 Street Name, City, State, 12345</p>` (عنوان وهمي)

### السبب الجذري
هذه بيانات وهمية (placeholder) لم تُستبدل ببيانات حقيقية أثناء التطوير. موثقة سابقاً في الخطة الأولى كـ M-11.

### الحل المقترح

#### الخطوة 1: الحصول على البيانات الحقيقية من العميل
> **⚠️ مطلوب من العميل (سحر القطرنجي):**
> - إيميل الموقع الرسمي
> - رقم الهاتف الصحيح
> - العنوان الفعلي (إن وُجد)

#### الخطوة 2: استبدال في جميع الملفات
```tsx
// Footer.tsx - استبدال البيانات الوهمية
<p className="mb-2">{SITE_PHONE}</p>         // ← رقم حقيقي
<p className="mb-2">{SITE_EMAIL}</p>         // ← إيميل حقيقي
<p className="mb-4">{SITE_ADDRESS}</p>       // ← عنوان حقيقي

// translations - تحديث contact_info
contact_info: '{SITE_EMAIL} | هاتف: {SITE_PHONE}',
```

#### الخطوة 3: مركزة البيانات
نقل بيانات التواصل إلى `constants.tsx` لتكون في مكان واحد:
```tsx
export const SITE_CONFIG = {
    email: 'real-email@modeya.com',
    phone: '+963-XXX-XXX-XXXX',
    address: 'العنوان الفعلي',
};
```

### الأولوية: P3 (منخفضة - لكن يؤثر على المصداقية)
### الجهد المقدر: 15 دقيقة (بعد الحصول على البيانات من العميل)

---

## NB-11: زر تخصيص المقاس → صفحة الخياطة + مشكلة التحديث عند الكتابة

### وصف العطل
> "وقت بضغط ع زر تخصيص مقاس لازم يطلع بصفحة الخياطة. وهاد زر تخصيص بقلبو تخصيص للمقاس وبقدر ضيف مقاسات يلي بدي ياها وبثقدر غير لون فستان وفي بوكس نص اسمو طلبات التخصيص الإضافية. حل مشكلة تحديث الصفحة عند كتابة"

### الملفات المتأثرة
- `components/ProductModal.tsx:82-90` (handleSizeSelect)
- `components/ProductModal.tsx:95-212` (CustomizationView - مُعرَّف داخل ProductModal)
- `components/ProductModal.tsx:311-320` (زر تخصيص المقاس)

### السبب الجذري - جزئين:

#### الجزء 1: مشكلة التحديث عند الكتابة
`CustomizationView` مُعرَّف كـ arrow function **داخل** `ProductModal` (سطر 95):

```tsx
const ProductModal: React.FC<...> = ({ ... }) => {
    // ... states ...
    
    const CustomizationView = () => (  // ← يُعاد إنشاؤه كل render!
        <div>
            <textarea value={customNotes} onChange={e => setCustomNotes(e.target.value)} />
        </div>
    );
    
    return (
        // ...
        {isCustomizing ? <CustomizationView /> : /* ... */}
    );
};
```

**نفس مشكلة NB-05 بالضبط**: عند الكتابة في حقل `customNotes` أو أي حقل مقاسات:
1. `onChange` يُحدّث `customNotes` state
2. `ProductModal` يعمل re-render
3. `CustomizationView` يُعاد تعريفه كـ function جديدة
4. React يفك المكون القديم ويُنشئ جديد
5. **حقل الإدخال يفقد الـ focus والمحتوى** ← "الصفحة تتحدث"

#### الجزء 2: سلوك زر التخصيص
حالياً زر "تخصيص مقاس" يعرض `CustomizationView` كـ inline view داخل الـ modal (سطر 82-90):

```tsx
const handleSizeSelect = (size: string) => {
    if (size === 'custom' || size === 'Custom' || size === t('product_modal_custom_size_button')) {
        setIsCustomizing(true);    // ← يعرض CustomizationView في نفس الـ modal
        setSelectedSize('Custom');
    } else {
        setSelectedSize(size);
        setIsCustomizing(false);
    }
};
```

العميل يريد أن الضغط على "تخصيص مقاس" **يفتح صفحة الخياطة** (dashboard → tailoring view) بدلاً من عرض التخصيص في modal المنتج.

### الحل المقترح

#### الخطوة 1: استخراج CustomizationView
نقل `CustomizationView` خارج `ProductModal` كمكون مستقل:

```typescript
// components/CustomizationView.tsx (ملف منفصل)
interface CustomizationViewProps {
    enableSizeCustom: boolean;
    setEnableSizeCustom: (v: boolean) => void;
    enableColorCustom: boolean;
    setEnableColorCustom: (v: boolean) => void;
    customMeasurements: Measurements;
    setCustomMeasurements: (m: Measurements) => void;
    customNotes: string;
    setCustomNotes: (n: string) => void;
    customColor: string;
    setCustomColor: (c: string) => void;
    onBack: () => void;
    onAddToCart: () => void;
    t: (key: string) => string;
}
```

هذا يحل مشكلة التحديث فوراً لأن React لن يعيد إنشاء المكون.

#### الخطوة 2: ربط زر التخصيص بصفحة الخياطة
خياران حسب رغبة العميل:

**خيار A - تحويل لصفحة الخياطة في الداشبورد:**
```tsx
const handleSizeSelect = (size: string) => {
    if (size === 'custom') {
        onClose(); // إغلاق modal المنتج
        onNavigate('user-dashboard'); // تحويل لصفحة الداشبورد
        // ← مع تمرير المنتج المحدد كـ state لعرضه في صفحة الخياطة
    }
};
```

**خيار B - إبقاء التخصيص في الـ Modal (الوضع الحالي) مع إصلاح التحديث:**
- نفس الواجهة الحالية لكن بدون مشكلة التحديث
- الميزات الموجودة تتطابق مع ما يريده العميل (مقاسات + لون + ملاحظات)

> **⚠️ مطلوب توضيح من العميل:** هل تريد أن الزر يفتح صفحة منفصلة (الداشبورد) أم يبقى في نفس الـ modal مع إصلاح المشكلة؟

### الأولوية: P0 (حرجة - يمنع استخدام ميزة التخصيص)
### الجهد المقدر: 2-3 ساعات
### ملاحظة: جزء التحديث يُحل مع NB-05 (استخراج المكونات)

---

## NB-12: إضافة تعليق وتقييم من نافذة "نظرة سريعة"

### وصف العطل
> "عند التصفح بالمنتجات واضغط ع زر نظرة سريعة بدي اقدر ضيف تعليق وتقييم للقطعة"

### الملفات المتأثرة
- `components/ProductModal.tsx:325-340` (قسم Reviews - للعرض فقط)
- `types.ts:4-8` (Review interface)
- `types.ts:10-19` (Product interface - reviews field)
- `services/api.ts` (لا يوجد endpoint لإرسال تقييم)

### السبب الجذري
قسم التقييمات في `ProductModal` هو **للعرض فقط** (read-only). لا يوجد أي نموذج لإضافة تقييم جديد:

```tsx
// ProductModal.tsx:325-340 - عرض التقييمات الموجودة فقط
{product.reviews && product.reviews.length > 0 && (
    <div className="my-6 pt-6 border-t border-gray-200">
        <h4 className="text-xl font-serif mb-6 text-start">{t('product_modal_reviews_title')}</h4>
        <div className="space-y-6">
            {product.reviews.map((review, index) => (
                <div key={index} className="text-start">
                    <div className="flex items-center mb-1">
                        <p className="font-semibold mr-3">{review.author}</p>
                        <StarRating rating={review.rating} />
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
            ))}
        </div>
    </div>
)}
```

المشاكل:
1. لا يوجد نموذج إدخال تقييم (Rating input + Comment textarea)
2. التقييمات هي `mock data` ثابتة في `constants.tsx` (فقط للمنتج الأول)
3. لا يوجد API endpoint لإرسال تقييم جديد
4. لا يوجد ربط بالمستخدم (من كتب التقييم)

### الحل المقترح

#### الخطوة 1: إنشاء مكون ReviewForm
```typescript
// components/shared/ReviewForm.tsx
interface ReviewFormProps {
    productId: number;
    onReviewSubmitted: (review: Review) => void;
}
```

الميزات المطلوبة:
- **اختيار التقييم (النجوم)**: 1-5 نجوم بـ hover effect تفاعلي
- **حقل التعليق**: textarea مع حد أدنى/أقصى للحروف
- **اسم الكاتب**: يُملأ تلقائياً من بيانات المستخدم المسجل
- **زر إرسال**: مع تحقق من صحة البيانات
- **رسالة نجاح**: بعد الإرسال

#### الخطوة 2: تحديث ProductModal
```tsx
// إضافة بعد قسم عرض التقييمات:
<div className="mt-6 pt-6 border-t border-gray-200">
    <h4 className="text-lg font-serif mb-4">{t('product_modal_add_review')}</h4>
    <ReviewForm 
        productId={product.id}
        onReviewSubmitted={(review) => {
            // إضافة التقييم للمنتج محلياً
            product.reviews = [...(product.reviews || []), review];
        }}
    />
</div>
```

#### الخطوة 3: مكون StarRatingInput (تفاعلي)
المكون `StarRating` الحالي (سطر 11-24) هو **للعرض فقط**. يجب إنشاء مكون تفاعلي:

```tsx
// components/shared/StarRatingInput.tsx
interface StarRatingInputProps {
    value: number;
    onChange: (rating: number) => void;
}

// نجوم قابلة للنقر مع hover effect
// عند hover: النجوم تتلون بالأصفر حتى النجمة المحددة
// عند النقر: يُثبت التقييم
```

#### الخطوة 4: API Endpoint
```typescript
// services/api.ts
async submitReview(productId: number, review: { rating: number; comment: string }): Promise<Review>

// Backend: POST /api/v1/products/:id/reviews
```

#### الخطوة 5: تحسينات إضافية
- إظهار متوسط التقييم على ProductCard (في قائمة المنتجات)
- منع المستخدم من كتابة أكثر من تقييم واحد لنفس المنتج
- عرض التقييمات من الأحدث للأقدم
- إذا المستخدم غير مسجل → رسالة "سجّل دخولك لكتابة تقييم"

### الأولوية: P1 (عالية - تُحسّن المصداقية والتفاعل)
### الجهد المقدر: 4-5 ساعات (Frontend + Backend)

---

## NB-13: صورة البنت في الموقع - الوجه مش باين

### وصف العطل
> "بدي الصورة البنت للموقع تكون مبين وجها اكتر"

### الملفات المتأثرة
- `components/Hero.tsx:14-16` (backgroundPosition)

### السبب الجذري
صورة الـ Hero معروضة بـ `backgroundPosition: 'center calc(50% + 100px)'`، مما يزيح الصورة للأسفل بـ 100px ويُخفي وجه العارضة:

```tsx
// Hero.tsx:13-17
className="relative h-[80vh] bg-cover bg-no-repeat bg-fixed"
style={{ 
    backgroundImage: "url('https://static.wixstatic.com/media/88aac0_...')",
    backgroundPosition: 'center calc(50% + 100px)'  // ← الوجه مخفي
}}
```

### الحل المقترح

#### تغيير backgroundPosition لإظهار الوجه:
```tsx
backgroundPosition: 'center top'
// أو تجربة قيمة محددة مثل:
backgroundPosition: 'center 20%'
```

> **ملاحظة**: تم تطبيق هذا الإصلاح مبدئياً (`center top`) - قد يحتاج ضبط دقيق بعد المراجعة المرئية مع العميل.

### الأولوية: P3 (منخفضة - تجميلي)
### الجهد المقدر: 10 دقائق

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
| NB-07 (تصنيفات Footer) | M-11 جزئياً | بيانات placeholder لم تُحدّث |
| NB-08 (فيديو المصممة) | جديد | ميزة جديدة مطلوبة - لا يوجد دعم فيديو |
| NB-09 (سياسات الشحن) | جديد | صفحات سياسات غير موجودة أصلاً |
| NB-10 (إيميل وهمي) | M-11 | بيانات تواصل وهمية لم تُستبدل |
| NB-11 (زر تخصيص + تحديث) | CR-03 / NB-05 | نفس سبب التحديث + تحسين سلوك الزر |
| NB-12 (تقييم من نظرة سريعة) | جديد | ميزة تقييم المنتجات غير موجودة |
| NB-13 (صورة الوجه) | جديد | ضبط CSS لموضع الصورة |

---

## خطة التنفيذ المقترحة (محدّثة)

### المرحلة 0: إصلاحات فورية (10 دقائق) ✅
1. **NB-13**: تعديل backgroundPosition في Hero.tsx ← **تم تطبيقه مبدئياً**

### المرحلة 1: إصلاحات حرجة (الأسبوع 1) - 10-15 ساعة
1. **NB-05 + NB-06 + NB-11 (التحديث)**: استخراج المكونات من UserDashboard + CustomizationView من ProductModal (4-5 ساعات)
   - هذا يحل مشكلة التحديث لجميع الأدوار وجميع الصفحات
   - **شرط مسبق** لبقية الإصلاحات
2. **NB-02**: إنشاء Overview مختلف لكل دور (2-3 ساعات)
   - CustomerOverview, DesignerOverview, TailorOverview
3. **NB-03**: إصلاح أيقونات البنك (1-2 ساعة)
4. **NB-07**: استبدال تصنيفات Footer (30 دقيقة)
5. **NB-10**: استبدال الإيميل الوهمي (15 دقيقة - بعد الحصول على البيانات)

### المرحلة 2: ميزات متوسطة (الأسبوع 2) - 10-14 ساعة
6. **NB-09**: صفحة سياسات الشحن (2-3 ساعات)
7. **NB-11 (السلوك)**: تحسين سلوك زر التخصيص (1-2 ساعة)
8. **NB-12**: نظام التقييم والتعليقات (4-5 ساعات)
9. **NB-08**: دعم رفع الفيديو للمصممة (4-6 ساعات)

### المرحلة 3: ميزات كبيرة (الأسابيع 3-4) - 18-24 ساعة
10. **NB-01**: نظام رفع الصور (6-8 ساعات)
11. **NB-04**: نظام المحادثة (12-16 ساعة)

### إجمالي الجهد المقدر: 38-53 ساعة عمل

---

## ملاحظات تقنية

### لماذا يجب البدء بـ NB-05/NB-06 أولاً؟
استخراج المكونات هو **شرط مسبق** لبقية الإصلاحات:
- بدون الاستخراج، أي إضافة state جديدة (مثل chat أو file upload أو review form) ستزيد مشكلة التحديث
- بعد الاستخراج، كل مكون يدير state مستقل بدون تأثير على البقية
- الكود يصبح أسهل للفهم والتعديل

### متطلبات Backend
الأعطال التالية تتطلب عمل على الـ Backend:
- `POST /api/v1/upload` - رفع ملفات (NB-01, NB-08)
- `GET /api/v1/orders/:id/messages` - جلب رسائل (NB-04)
- `POST /api/v1/orders/:id/messages` - إرسال رسالة (NB-04)
- `POST /api/v1/products/:id/reviews` - إرسال تقييم (NB-12)
- `GET /api/v1/products/:id/reviews` - جلب تقييمات (NB-12)
- تخزين الملفات المرفوعة (filesystem أو cloud storage)
- حقل `video_url` في جدول portfolio_items (NB-08)

### بيانات مطلوبة من العميل
> **⚠️ قبل تنفيذ بعض الإصلاحات، نحتاج معلومات من العميل:**
> 1. **NB-10**: الإيميل الحقيقي + رقم الهاتف + العنوان (إن وُجد)
> 2. **NB-09**: نصوص سياسات الشحن والإرجاع الخاصة بالمتجر
> 3. **NB-11**: توضيح: هل زر التخصيص يفتح صفحة منفصلة أم يبقى في الـ modal؟
