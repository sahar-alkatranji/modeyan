# 🧠 Agent.md - MODEYAN

## 📊 نظرة عامة
- **نوع المشروع:** Web App (Full-stack / Boutique E-commerce)
- **اللغة:** TypeScript / React
- **الإطار:** Vite / React 19
- **نقطة الدخول:** `App.tsx` / `index.tsx`
- **GitHub:** https://github.com/sahar-alkatranji/modeyan

---

## 🌲 المخطط الشجري
```
modeyan/
├── components/
│   ├── dashboard/           # مكونات لوحة التحكم المفككة (12 مكون)
│   │   ├── DashboardShared.tsx   # glassCardClass, Icon, MetricCard, ConfirmDialog
│   │   ├── AdminProducts.tsx     # إدارة المنتجات مع مودالات
│   │   ├── AdminUsers.tsx        # إدارة المستخدمين
│   │   ├── AdminPayments.tsx     # إعدادات الدفع
│   │   ├── AdminSocials.tsx      # روابط التواصل
│   │   ├── AdminOrders.tsx       # إدارة الطلبات
│   │   ├── AdminDesignAssets.tsx # أصول استوديو التصميم
│   │   ├── ManagerOverview.tsx   # نظرة عامة حسب الدور
│   │   ├── DesignStudio.tsx      # استوديو تصميم الفستان
│   │   ├── MyDesigns.tsx         # تصاميمي المحفوظة
│   │   ├── ProfessionalPortfolio.tsx # معرض الأعمال
│   │   └── StripePaymentForm.tsx # نموذج دفع Stripe
│   ├── ErrorBoundary.tsx    # حماية من الأعطال - يعرض صفحة خطأ بدلاً من شاشة بيضاء
│   ├── ShippingPolicyPage.tsx # صفحة سياسة الشحن + تتبع الطلب
│   ├── CustomizationView.tsx  # تخصيص المقاسات (مكون مستقل)
│   ├── ProductModal.tsx       # نافذة تفاصيل المنتج + زر تخصيص
│   ├── Footer.tsx             # فوتر مع تصنيفات الفساتين المربوطة
│   └── Contact.tsx            # صفحة الاتصال مع واتساب
├── contexts/
│   ├── AuthContext.tsx    # AuthProvider + AuthContext (بدون useAuth)
│   ├── useAuth.ts         # hook مستقل لإصلاح HMR
│   └── LanguageContext.tsx
├── translations/
│   ├── ar.ts              # الترجمة العربية الكاملة
│   └── en.ts              # الترجمة الإنجليزية الكاملة
├── App.tsx                # نقطة التحكم + shopCategory state
├── index.tsx              # نقطة الدخول + ErrorBoundary
├── constants.tsx          # ثوابت المتجر والتصنيفات والمنتجات
├── types.ts               # TypeScript types
└── services/api.ts        # API client مع timeout وfallbacks
```

---

## 🛠️ أوامر التشغيل
| الأمر | الوظيفة |
|-------|---------| 
| `npm run dev` | تشغيل خادم التطوير (المنفذ 3000) |
| `npm run build` | بناء النسخة الإنتاجية (Vite) |
| `git push origin main` | النشر على GitHub |

**ملاحظة:** كل الأوامر تعمل في **PowerShell** (ليس Git Bash) - لا تستخدم `&&`

---

## 📦 التبعيات الرئيسية
| المكتبة | الإصدار | الوظيفة |
|---------|---------|---------| 
| `react` | `^19.2.0` | واجهات المستخدم |
| `@stripe/react-stripe-js` | `2.6.0` | معالجة الدفع (تتطلب `--legacy-peer-deps` لتثبيتها) |
| `vite` | `^6.4.2` | bundler |

---

## ✅ الإصلاحات المكتملة

### P0 - حرجة (تم إصلاحها)
- ✅ **HMR Loop** - فصل `useAuth` إلى `contexts/useAuth.ts` مستقل
- ✅ **Error Boundary** - صفحة خطأ بدلاً من شاشة بيضاء
- ✅ **تفكيك UserDashboard** - 12 مكون مستقل في `dashboard/`

### P2 - UX (تم إصلاحها)
- ✅ **تصنيفات الفوتر** - 6 تصنيفات فساتين (طويل/قصير/صيفي/شتوي/ربيعي/خريفي)
- ✅ **ربط فوتر بالمتجر** - النقر على تصنيف يفتح المتجر مفلتراً
- ✅ **صورة وجه البنت** - `object-top` + `h-[420px]` في `About.tsx`
- ✅ **معلومات الاتصال** - bsaman710@gmail.com + +963969656346
- ✅ **واتساب** - زر wa.me/963969656346 في Footer + Contact
- ✅ **زر تخصيص المقاس** - يفتح `CustomizationView` في ProductModal
- ✅ **سياسة الشحن** - صفحة كاملة مع التتبع

---

## ⚠️ المشاكل المعروفة والحلول
| المشكلة | السبب | الحل | التاريخ |
|---------|-------|------|---------| 
| HMR Loop / شاشة بيضاء | AuthContext تصدر hook + component من نفس الملف | فصل `useAuth` إلى ملف مستقل | 2026-05-21 |
| فقدان الـ Focus في تخصيص المقاسات | تعريف المكون داخل مكون أبوي يسبب إعادة بناء DOM | فصل `CustomizationView` كملف مستقل | 2026-05-21 |
| `npm install` يفشل مع React 19 + Stripe | تعارض الإصدارات | استخدام `npm install --legacy-peer-deps` | 2026-05-21 |

---

## 🚫 أنماط يجب تجنبها
- **لا تعرّف React Component وhook في نفس الملف** - يكسر Vite Fast Refresh
- **لا تستخدم `&&` في PowerShell** - استخدم `;` أو أوامر منفصلة
- **لا تعرّف مكونات داخل مكونات أبوية** - يتسبب في Re-mounting و فقدان Focus

---

## 🔗 بيئة المشروع
- Backend: يعمل على `http://localhost:8000/api/v1` (معطل حالياً، الواجهة تعمل بـ fallbacks)
- GitHub: `https://github.com/sahar-alkatranji/modeyan`
- Email: `bsaman710@gmail.com`
- WhatsApp: `https://wa.me/963969656346`

---

## 🧹 صيانة الذاكرة
### آخر تحديث: 2026-05-21
- الملف محدث بعد جلسة إصلاحات شاملة
- الحجم الحالي ضمن الحد المثالي
