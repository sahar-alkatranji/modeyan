# MODEYA - Backend Implementation Plan 01
# خطة بناء الباك إند بالكامل (Laravel)

> **المشروع:** MODEYA - Fashion Boutique  
> **التاريخ:** 2026-05-21  
> **المرجع:** ImplementationPlan.md + ImplementationPlan02.md + fix01.md  
> **التقنية:** Laravel 11 + SQLite + Sanctum  
> **المجلد:** `backend/` (داخل المجلد الحالي)  
> **البورت:** 8000 (يطابق `API_BASE` في الفرونت: `http://localhost:8000/api/v1`)

---

## الملخص التنفيذي

بناء باك إند كامل بـ Laravel يغطي **34 endpoint** يستدعيها الفرونت حالياً + **14 endpoint جديد** مطلوب من الخطط السابقة.

### لماذا Laravel؟
- يخدم على port 8000 افتراضياً (يطابق الفرونت بدون تعديل)
- Sanctum يوفر JWT-like token auth بسهولة
- SQLite لا يحتاج تنصيب database server (ملف واحد)
- Artisan commands لتوليد Models/Controllers/Migrations بسرعة
- `setup.bat` واحد يشغّل المشروع على أي لابتوب

### ملفات التشغيل
| الملف | الوظيفة |
|--------|---------|
| `setup.bat` | تنصيب كل شيء: composer install + .env + key:generate + migrate + seed |
| `start.bat` | تشغيل السيرفر على port 8000 |
| `clear.bat` | مسح كل الكاش + إعادة تهيئة القاعدة |

---

## المعمارية العامة

```
modeyan/
├── backend/                    ← مجلد Laravel الجديد
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/V1/    ← كل Controllers هنا
│   │   │   ├── Middleware/
│   │   │   │   ├── RoleMiddleware.php
│   │   │   │   └── CorsMiddleware.php
│   │   │   └── Requests/      ← Form Request Validation
│   │   ├── Models/
│   │   └── Services/
│   │       ├── WalletService.php
│   │       ├── FileUploadService.php
│   │       └── GeminiService.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php            ← كل الـ API routes
│   ├── storage/
│   │   └── app/public/uploads/ ← ملفات مرفوعة
│   └── .env
├── setup.bat
├── start.bat
├── clear.bat
├── services/api.ts            ← الفرونت (بدون تغيير)
└── ...
```

---

## المرحلة 0: إنشاء المشروع وملفات التشغيل
**الجهد: 1-2 ساعة**

### 0.1 إنشاء مشروع Laravel

```bash
composer create-project laravel/laravel backend
cd backend
composer require laravel/sanctum
php artisan install:api
```

### 0.2 إعداد `.env`

```env
APP_NAME=Modeya
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

FILESYSTEM_DISK=public

GEMINI_API_KEY=your-gemini-key-here

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 0.3 إعداد CORS

ملف `config/cors.php`:
```php
'paths' => ['api/*'],
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### 0.4 إعداد Route Prefix

ملف `bootstrap/app.php` أو `RouteServiceProvider`:
```php
Route::prefix('api/v1')
    ->middleware('api')
    ->group(base_path('routes/api.php'));
```

هذا يجعل كل الـ routes تبدأ بـ `/api/v1/` مطابقة لـ `API_BASE` في الفرونت.

### 0.5 ملفات Batch

#### `setup.bat`
```batch
@echo off
echo ========================================
echo    MODEYA Backend Setup
echo ========================================

REM Check PHP
php -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PHP is not installed or not in PATH.
    echo Download from: https://windows.php.net/download/
    echo Make sure to enable extensions: pdo_sqlite, fileinfo, openssl, mbstring
    pause
    exit /b 1
)

REM Check Composer
composer -V >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Composer is not installed.
    echo Download from: https://getcomposer.org/download/
    pause
    exit /b 1
)

cd backend

REM Install dependencies
echo [1/6] Installing dependencies...
call composer install --no-interaction

REM Create .env
if not exist .env (
    echo [2/6] Creating .env file...
    copy .env.example .env
) else (
    echo [2/6] .env already exists, skipping...
)

REM Generate app key
echo [3/6] Generating application key...
php artisan key:generate --force

REM Create SQLite database
if not exist database\database.sqlite (
    echo [4/6] Creating SQLite database...
    type nul > database\database.sqlite
) else (
    echo [4/6] Database already exists, skipping...
)

REM Run migrations
echo [5/6] Running database migrations...
php artisan migrate --force

REM Run seeders
echo [6/6] Seeding database with initial data...
php artisan db:seed --force

REM Create storage link
php artisan storage:link 2>nul

echo.
echo ========================================
echo    Setup Complete!
echo    Run start.bat to start the server
echo ========================================
pause
```

#### `start.bat`
```batch
@echo off
echo ========================================
echo    MODEYA Backend Server
echo    http://localhost:8000
echo    Press Ctrl+C to stop
echo ========================================
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

#### `clear.bat`
```batch
@echo off
echo ========================================
echo    MODEYA Backend - Clear & Reset
echo ========================================
cd backend

echo [1/4] Clearing caches...
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo [2/4] Resetting database...
php artisan migrate:fresh --force

echo [3/4] Re-seeding data...
php artisan db:seed --force

echo [4/4] Clearing upload files...
if exist storage\app\public\uploads rd /s /q storage\app\public\uploads
mkdir storage\app\public\uploads

echo.
echo ========================================
echo    Reset Complete!
echo ========================================
pause
```

---

## المرحلة 1: قاعدة البيانات (Migrations)
**الجهد: 3-4 ساعات**

### 1.1 مخطط قاعدة البيانات الكامل

```
┌─────────────────────┐     ┌──────────────────────┐
│       users          │     │   wallet_transactions │
├─────────────────────┤     ├──────────────────────┤
│ id (PK)             │──┐  │ id (PK)              │
│ first_name          │  │  │ user_id (FK→users)   │
│ last_name           │  │  │ type (credit/debit)  │
│ email (unique)      │  │  │ amount               │
│ password            │  │  │ description          │
│ phone               │  │  │ reference_type       │
│ role (enum)         │  │  │ reference_id         │
│ profile_image       │  │  │ balance_after        │
│ bio                 │  │  │ created_at           │
│ balance (decimal)   │  │  └──────────────────────┘
│ pending_balance     │  │
│ is_active (bool)    │  │  ┌──────────────────────┐
│ created_at          │  │  │     categories       │
│ updated_at          │  │  ├──────────────────────┤
└─────────────────────┘  │  │ id (PK)              │
                         │  │ name                 │
┌─────────────────────┐  │  │ name_ar              │
│    dress_parts      │  │  │ slug (unique)        │
├─────────────────────┤  │  │ parent_id (FK→self)  │
│ id (PK)             │  │  │ is_active            │
│ name                │  │  │ created_at           │
│ category (enum)     │  │  └──────────────────────┘
│ part_type           │  │
│ image_url           │  │  ┌──────────────────────┐
│ filename            │  │  │      designs         │
│ is_active (bool)    │  │  ├──────────────────────┤
│ sort_order          │  │  │ id (PK)              │
│ created_at          │  ├──│ designer_id (FK)     │
└─────────────────────┘  │  │ name                 │
                         │  │ description          │
┌─────────────────────┐  │  │ design_type          │
│      orders         │  │  │ image_url            │
├─────────────────────┤  │  │ is_public (bool)     │
│ id (PK)             │  │  │ price                │
│ customer_id (FK)    │←─┤  │ selected_parts (JSON)│
│ tailor_id (FK)      │←─┤  │ created_at           │
│ design_id (FK)      │  │  └──────────────────────┘
│ status (enum)       │  │
│ design_type         │  │  ┌──────────────────────┐
│ total_price         │  │  │  portfolio_items     │
│ selected_parts(JSON)│  │  ├──────────────────────┤
│ notes               │  │  │ id (PK)              │
│ created_at          │  ├──│ tailor_id (FK)       │
│ updated_at          │  │  │ title                │
└─────────────────────┘  │  │ description          │
                         │  │ price                │
┌─────────────────────┐  │  │ status (enum)        │
│   order_messages    │  │  │ video_url            │
├─────────────────────┤  │  │ created_at           │
│ id (PK)             │  │  └──────────────────────┘
│ order_id (FK)       │  │
│ sender_id (FK)      │←─┤  ┌──────────────────────┐
│ text                │  │  │  portfolio_images    │
│ is_read (bool)      │  │  ├──────────────────────┤
│ created_at          │  │  │ id (PK)              │
└─────────────────────┘  │  │ portfolio_item_id(FK)│
                         │  │ image_url            │
┌─────────────────────┐  │  │ sort_order           │
│  payment_methods    │  │  └──────────────────────┘
├─────────────────────┤  │
│ id (PK)             │  │  ┌──────────────────────┐
│ name                │  │  │  portfolio_sizes     │
│ translation_key     │  │  ├──────────────────────┤
│ is_active (bool)    │  │  │ id (PK)              │
│ img_url             │  │  │ portfolio_item_id(FK)│
│ type                │  │  │ size                 │
│ details (JSON)      │  │  │ quantity             │
│ sort_order          │  │  └──────────────────────┘
│ created_at          │  │
└─────────────────────┘  │  ┌──────────────────────┐
                         │  │      reviews         │
┌─────────────────────┐  │  ├──────────────────────┤
│    social_links     │  │  │ id (PK)              │
├─────────────────────┤  │  │ portfolio_item_id(FK)│
│ id (PK)             │  ├──│ user_id (FK)         │
│ name                │  │  │ rating (1-5)         │
│ href                │  │  │ comment              │
│ is_enabled (bool)   │  │  │ created_at           │
│ icon_svg            │  │  └──────────────────────┘
│ sort_order          │  │
│ created_at          │  │  ┌──────────────────────┐
└─────────────────────┘  │  │  shipping_policies   │
                         │  ├──────────────────────┤
┌─────────────────────┐  │  │ id (PK)              │
│     settings        │  │  │ title                │
├─────────────────────┤  │  │ title_ar             │
│ id (PK)             │  │  │ description          │
│ key (unique)        │  │  │ description_ar       │
│ value (text)        │  │  │ price                │
│ is_public (bool)    │  │  │ estimated_days       │
│ updated_at          │  │  │ is_active (bool)     │
└─────────────────────┘  │  │ created_at           │
                         │  └──────────────────────┘
┌─────────────────────┐  │
│      media          │  │  ← للملفات المرفوعة
├─────────────────────┤  │
│ id (PK)             │  │
│ user_id (FK)        │←─┘
│ model_type          │     ← polymorphic: 'portfolio', 'design', 'product'
│ model_id            │
│ file_path           │
│ file_name           │
│ mime_type           │
│ size_bytes          │
│ created_at          │
└─────────────────────┘
```

### 1.2 الـ Migrations بالترتيب

```
01 - create_users_table            ← يعدّل الافتراضي ليضيف role, balance, etc.
02 - create_personal_access_tokens ← من Sanctum
03 - create_categories_table
04 - create_dress_parts_table
05 - create_designs_table
06 - create_portfolio_items_table
07 - create_portfolio_images_table
08 - create_portfolio_sizes_table
09 - create_orders_table
10 - create_order_messages_table
11 - create_payment_methods_table
12 - create_social_links_table
13 - create_settings_table
14 - create_wallet_transactions_table
15 - create_reviews_table
16 - create_shipping_policies_table
17 - create_media_table
```

### 1.3 Migration التفصيلية - users (الأهم)

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('first_name');
    $table->string('last_name');
    $table->string('email')->unique();
    $table->string('password');
    $table->string('phone')->nullable();
    $table->enum('role', ['customer', 'manager', 'designer', 'tailor'])->default('customer');
    $table->string('profile_image')->nullable();
    $table->text('bio')->nullable();
    $table->decimal('balance', 12, 2)->default(0);
    $table->decimal('pending_balance', 12, 2)->default(0);
    $table->boolean('is_active')->default(true);
    $table->rememberToken();
    $table->timestamps();
});
```

### 1.4 Migration التفصيلية - orders

```php
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('tailor_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('design_id')->nullable()->constrained('designs')->nullOnDelete();
    $table->enum('status', [
        'pending_quote', 'quote_submitted', 'quote_accepted',
        'in_progress', 'completed', 'cancelled', 'disputed'
    ])->default('pending_quote');
    $table->string('design_type')->nullable();
    $table->decimal('total_price', 12, 2)->nullable();
    $table->json('selected_parts')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

### 1.5 Migration التفصيلية - order_messages (للمحادثة NB-04)

```php
Schema::create('order_messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained()->cascadeOnDelete();
    $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
    $table->text('text');
    $table->boolean('is_read')->default(false);
    $table->timestamps();
});
```

### 1.6 Migration التفصيلية - media (لرفع الملفات NB-01)

```php
Schema::create('media', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('model_type')->nullable();
    $table->unsignedBigInteger('model_id')->nullable();
    $table->string('file_path');
    $table->string('file_name');
    $table->string('mime_type');
    $table->unsignedBigInteger('size_bytes');
    $table->timestamps();

    $table->index(['model_type', 'model_id']);
});
```

---

## المرحلة 2: النماذج (Models)
**الجهد: 2-3 ساعات**

### 2.1 قائمة النماذج

| Model | الجدول | العلاقات الرئيسية |
|-------|--------|-------------------|
| `User` | users | hasMany: orders, designs, portfolioItems, walletTransactions, messages, reviews |
| `Category` | categories | hasMany: children (self-referential), belongsTo: parent |
| `DressPart` | dress_parts | - |
| `Design` | designs | belongsTo: designer (User) |
| `Order` | orders | belongsTo: customer, tailor (User), design. hasMany: messages |
| `OrderMessage` | order_messages | belongsTo: order, sender (User) |
| `PortfolioItem` | portfolio_items | belongsTo: tailor (User). hasMany: images, sizes, reviews |
| `PortfolioImage` | portfolio_images | belongsTo: portfolioItem |
| `PortfolioSize` | portfolio_sizes | belongsTo: portfolioItem |
| `PaymentMethod` | payment_methods | - |
| `SocialLink` | social_links | - |
| `Setting` | settings | - |
| `WalletTransaction` | wallet_transactions | belongsTo: user |
| `Review` | reviews | belongsTo: portfolioItem, user |
| `ShippingPolicy` | shipping_policies | - |
| `Media` | media | belongsTo: user. morphTo: model |

### 2.2 Model User (التفصيلي)

```php
class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'first_name', 'last_name', 'email', 'password',
        'phone', 'role', 'profile_image', 'bio',
        'balance', 'pending_balance', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'balance' => 'decimal:2',
        'pending_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // --- العلاقات ---
    public function orders()           { return $this->hasMany(Order::class, 'customer_id'); }
    public function tailorOrders()     { return $this->hasMany(Order::class, 'tailor_id'); }
    public function designs()          { return $this->hasMany(Design::class, 'designer_id'); }
    public function portfolioItems()   { return $this->hasMany(PortfolioItem::class, 'tailor_id'); }
    public function walletTransactions(){ return $this->hasMany(WalletTransaction::class); }
    public function reviews()          { return $this->hasMany(Review::class); }

    // --- التحويل للـ API Response ---
    public function toApiResponse(): array
    {
        return [
            'id'              => $this->id,
            'email'           => $this->email,
            'first_name'      => $this->first_name,
            'last_name'       => $this->last_name,
            'phone'           => $this->phone,
            'role'            => $this->role,
            'is_active'       => $this->is_active,
            'profile_image'   => $this->profile_image,
            'bio'             => $this->bio,
            'balance'         => (float) $this->balance,
            'pending_balance' => (float) $this->pending_balance,
            'created_at'      => $this->created_at?->toISOString(),
        ];
    }
}
```

هذا الـ `toApiResponse()` يطابق بالضبط `ApiUser` interface في الفرونت:
```typescript
// services/api.ts - الفرونت يتوقع هذا الشكل بالضبط
interface ApiUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  profile_image?: string;
  bio?: string;
  balance: number;
  pending_balance: number;
  created_at?: string;
}
```

---

## المرحلة 3: التوثيق (Authentication)
**الجهد: 2-3 ساعات**

### 3.1 Auth Controller

```
App\Http\Controllers\Api\V1\AuthController
```

| Method | Route | الوصف | يطابق في الفرونت |
|--------|-------|-------|-------------------|
| `login` | `POST /auth/login` | تسجيل دخول + إرجاع token | `api.login()` |
| `register` | `POST /auth/register` | إنشاء حساب + إرجاع token | `api.register()` |
| `me` | `GET /auth/me` | بيانات المستخدم الحالي | `api.getMe()` |
| `updateMe` | `PUT /auth/me` | تحديث بيانات المستخدم | `api.updateMe()` |
| `changePassword` | `PUT /auth/change-password` | تغيير كلمة المرور | `api.changePassword()` |

### 3.2 شكل الـ Response (يطابق الفرونت بالضبط)

```php
// POST /auth/login Response
// يطابق TokenResponse في الفرونت
{
    "access_token": "1|abc123...",
    "token_type": "Bearer",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "first_name": "سحر",
        "last_name": "القطرنجي",
        "phone": "+963...",
        "role": "manager",
        "is_active": true,
        "profile_image": null,
        "bio": null,
        "balance": 0.00,
        "pending_balance": 0.00,
        "created_at": "2026-05-21T00:00:00.000Z"
    }
}
```

### 3.3 Login Method (التفصيلي)

```php
public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['Invalid credentials.'],
        ]);
    }

    if (!$user->is_active) {
        throw ValidationException::withMessages([
            'email' => ['Account is deactivated.'],
        ]);
    }

    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json([
        'access_token' => $token,
        'token_type'   => 'Bearer',
        'user'         => $user->toApiResponse(),
    ]);
}
```

### 3.4 Middleware للأدوار

```php
// app/Http/Middleware/RoleMiddleware.php
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!in_array($request->user()->role, $roles)) {
            abort(403, 'Unauthorized role.');
        }
        return $next($request);
    }
}
```

استخدامه في Routes:
```php
Route::middleware(['auth:sanctum', 'role:manager'])->group(function () {
    // Admin-only routes
});
```

---

## المرحلة 4: الـ API Routes الكاملة
**الجهد: 1-2 ساعة**

### 4.1 القسم A: المصادقة (بدون auth)

```php
// routes/api.php
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',              [AuthController::class, 'me']);
        Route::put('/me',              [AuthController::class, 'updateMe']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });
});
```

### 4.2 القسم B: المستخدم المسجل (auth:sanctum)

```php
Route::middleware('auth:sanctum')->group(function () {

    // --- المحفظة ---
    Route::get('/wallet',       [WalletController::class, 'show']);
    Route::post('/wallet/top-up', [WalletController::class, 'topUp']);

    // --- أجزاء الفستان ---
    Route::get('/parts', [DressPartController::class, 'index']);

    // --- التصاميم ---
    Route::get('/designs',        [DesignController::class, 'index']);
    Route::post('/designs',       [DesignController::class, 'store']);
    Route::delete('/designs/{id}', [DesignController::class, 'destroy']);

    // --- الطلبات ---
    Route::get('/orders',              [OrderController::class, 'index']);
    Route::post('/orders',             [OrderController::class, 'store']);
    Route::get('/orders/{id}',         [OrderController::class, 'show']);
    Route::put('/orders/{id}/status',  [OrderController::class, 'updateStatus']);
    Route::delete('/orders/{id}',      [OrderController::class, 'destroy']);

    // --- رسائل الطلب (NB-04 - المحادثة) ---
    Route::get('/orders/{id}/messages',  [OrderMessageController::class, 'index']);
    Route::post('/orders/{id}/messages', [OrderMessageController::class, 'store']);

    // --- البورتفوليو ---
    Route::get('/portfolio',    [PortfolioController::class, 'index']);
    Route::post('/portfolio',   [PortfolioController::class, 'store']);

    // --- رفع ملفات (NB-01) ---
    Route::post('/upload', [UploadController::class, 'store']);

    // --- المستخدمون ---
    Route::get('/users',           [UserController::class, 'index']);
    Route::delete('/users/{id}',   [UserController::class, 'destroy']);

    // --- المعاملات المالية ---
    Route::get('/transactions', [TransactionController::class, 'index']);

    // --- التقييمات (NB-12) ---
    Route::get('/products/{id}/reviews',  [ReviewController::class, 'index']);
    Route::post('/products/{id}/reviews', [ReviewController::class, 'store']);

    // --- سياسات الشحن (NB-09) ---
    Route::get('/shipping-policies', [ShippingPolicyController::class, 'index']);

    // --- توليد صورة AI (CR-01) ---
    Route::post('/ai/generate-image', [AiController::class, 'generateImage']);
});
```

### 4.3 القسم C: المدير فقط (role:manager)

```php
Route::middleware(['auth:sanctum', 'role:manager'])->prefix('admin')->group(function () {

    // --- الإحصائيات ---
    Route::get('/stats',   [AdminController::class, 'stats']);
    Route::get('/orders',  [AdminController::class, 'orders']);

    // --- إدارة محافظ المستخدمين ---
    Route::put('/users/{id}/wallet', [AdminController::class, 'updateUserWallet']);

    // --- طرق الدفع ---
    Route::get('/payment-methods',          [PaymentMethodController::class, 'index']);
    Route::post('/payment-methods',         [PaymentMethodController::class, 'store']);
    Route::put('/payment-methods/{id}',     [PaymentMethodController::class, 'update']);
    Route::delete('/payment-methods/{id}',  [PaymentMethodController::class, 'destroy']);

    // --- روابط السوشال ---
    Route::get('/social-links',  [SocialLinkController::class, 'index']);
    Route::put('/social-links',  [SocialLinkController::class, 'update']);

    // --- الإعدادات ---
    Route::get('/settings/public', [SettingsController::class, 'publicSettings']);

    // --- الموافقات (Portfolio) ---
    Route::get('/portfolio/pending',         [PortfolioController::class, 'pending']);
    Route::put('/portfolio/{id}/approve',    [PortfolioController::class, 'approve']);
    Route::put('/portfolio/{id}/reject',     [PortfolioController::class, 'reject']);

    // --- إدارة أجزاء الفستان (BUG-08) ---
    Route::post('/parts',          [DressPartController::class, 'store']);
    Route::put('/parts/{id}',      [DressPartController::class, 'update']);
    Route::delete('/parts/{id}',   [DressPartController::class, 'destroy']);

    // --- التصنيفات (CR-09) ---
    Route::get('/categories',          [CategoryController::class, 'index']);
    Route::post('/categories',         [CategoryController::class, 'store']);
    Route::put('/categories/{id}',     [CategoryController::class, 'update']);
    Route::delete('/categories/{id}',  [CategoryController::class, 'destroy']);

    // --- سياسات الشحن - إدارة (NB-09) ---
    Route::post('/shipping-policies',         [ShippingPolicyController::class, 'store']);
    Route::put('/shipping-policies/{id}',     [ShippingPolicyController::class, 'update']);
    Route::delete('/shipping-policies/{id}',  [ShippingPolicyController::class, 'destroy']);
});
```

### 4.4 القسم D: عام (بدون auth)

```php
// الإعدادات العامة - متاحة بدون تسجيل دخول
Route::get('/admin/settings/public', [SettingsController::class, 'publicSettings']);
```

### 4.5 ملاحظة: endpoint الموافقات (Portfolio pending)

الفرونت يستدعي:
```typescript
api.getPendingPortfolio()  // GET /portfolio/pending
```

لكن هذا الـ endpoint يجب أن يكون للمدير فقط. نسجّله مرتين:
```php
// للمدير: /admin/portfolio/pending (الأصح)
// للتوافق مع الفرونت: /portfolio/pending (يتحقق من role داخلياً)
Route::get('/portfolio/pending', [PortfolioController::class, 'pending'])
    ->middleware('role:manager');
```

---

## المرحلة 5: Controllers التفصيلية
**الجهد: 8-12 ساعة**

### 5.1 قائمة الـ Controllers

| Controller | عدد Methods | يغطي |
|-----------|-------------|-------|
| `AuthController` | 5 | تسجيل/دخول/خروج/ملف شخصي |
| `WalletController` | 2 | عرض + شحن المحفظة |
| `DressPartController` | 4 | CRUD أجزاء الفستان |
| `DesignController` | 3 | عرض + إنشاء + حذف تصاميم |
| `OrderController` | 5 | CRUD طلبات + تحديث حالة |
| `OrderMessageController` | 2 | جلب + إرسال رسائل (NB-04) |
| `PortfolioController` | 5 | CRUD + موافقة/رفض |
| `AdminController` | 3 | إحصائيات + طلبات + محافظ |
| `PaymentMethodController` | 4 | CRUD طرق الدفع |
| `SocialLinkController` | 2 | عرض + تحديث سوشال |
| `SettingsController` | 1 | إعدادات عامة |
| `UserController` | 2 | عرض + حذف مستخدمين |
| `TransactionController` | 1 | عرض المعاملات |
| `UploadController` | 1 | رفع ملفات (NB-01) |
| `ReviewController` | 2 | عرض + إضافة تقييمات (NB-12) |
| `CategoryController` | 4 | CRUD تصنيفات (CR-09) |
| `ShippingPolicyController` | 4 | CRUD سياسات الشحن (NB-09) |
| `AiController` | 1 | proxy لـ Gemini API (CR-01) |
| **المجموع** | **50** | |

### 5.2 WalletController (يوضح نمط التطوير)

```php
class WalletController extends Controller
{
    // GET /api/v1/wallet
    // يطابق: api.getWallet() → { id, balance, pending_balance }
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id'              => $user->id,
            'balance'         => (float) $user->balance,
            'pending_balance' => (float) $user->pending_balance,
        ]);
    }

    // POST /api/v1/wallet/top-up
    // يطابق: api.topUpWallet(amount) → { id, balance, pending_balance }
    public function topUp(Request $request, WalletService $walletService)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1|max:100000',
        ]);

        $user = $walletService->topUp(
            $request->user(),
            $request->amount
        );

        return response()->json([
            'id'              => $user->id,
            'balance'         => (float) $user->balance,
            'pending_balance' => (float) $user->pending_balance,
        ]);
    }
}
```

### 5.3 OrderMessageController (NB-04 - المحادثة)

```php
class OrderMessageController extends Controller
{
    // GET /api/v1/orders/{id}/messages
    public function index(Request $request, int $id)
    {
        $order = Order::findOrFail($id);

        // تأكد أن المستخدم طرف في الطلب
        $user = $request->user();
        if ($user->id !== $order->customer_id
            && $user->id !== $order->tailor_id
            && $user->role !== 'manager') {
            abort(403, 'Not authorized to view these messages.');
        }

        // علّم الرسائل كمقروءة
        $order->messages()
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(
            $order->messages()
                ->with('sender:id,first_name,last_name')
                ->orderBy('created_at')
                ->get()
                ->map(fn ($msg) => [
                    'id'        => (string) $msg->id,
                    'senderId'  => (string) $msg->sender_id,
                    'text'      => $msg->text,
                    'timestamp' => $msg->created_at->toISOString(),
                    'senderName'=> $msg->sender->first_name . ' ' . $msg->sender->last_name,
                    'isRead'    => $msg->is_read,
                ])
        );
    }

    // POST /api/v1/orders/{id}/messages
    public function store(Request $request, int $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        if ($user->id !== $order->customer_id
            && $user->id !== $order->tailor_id
            && $user->role !== 'manager') {
            abort(403, 'Not authorized to send messages here.');
        }

        $request->validate([
            'text' => 'required|string|max:5000',
        ]);

        $message = $order->messages()->create([
            'sender_id' => $user->id,
            'text'      => $request->text,
        ]);

        return response()->json([
            'id'        => (string) $message->id,
            'senderId'  => (string) $message->sender_id,
            'text'      => $message->text,
            'timestamp' => $message->created_at->toISOString(),
        ], 201);
    }
}
```

### 5.4 UploadController (NB-01 - رفع الملفات)

```php
class UploadController extends Controller
{
    // POST /api/v1/upload
    // يقبل: multipart/form-data مع حقل 'file'
    // يرجع: { url: string }
    public function store(Request $request, FileUploadService $uploadService)
    {
        $request->validate([
            'file' => 'required|file|max:102400', // 100MB max
            'type' => 'nullable|in:image,video',
        ]);

        $file = $request->file('file');
        $type = $request->input('type', 'image');

        // تحقق من نوع الملف
        $allowedMimes = $type === 'video'
            ? ['video/mp4', 'video/webm', 'video/quicktime']
            : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            abort(422, 'Invalid file type.');
        }

        $url = $uploadService->upload($file, $request->user());

        return response()->json(['url' => $url]);
    }
}
```

### 5.5 AdminController (الإحصائيات)

```php
class AdminController extends Controller
{
    // GET /api/v1/admin/stats
    // يطابق: api.getAdminStats()
    public function stats()
    {
        return response()->json([
            'total_users'       => User::count(),
            'total_customers'   => User::where('role', 'customer')->count(),
            'total_tailors'     => User::where('role', 'tailor')->count(),
            'total_designers'   => User::where('role', 'designer')->count(),
            'total_orders'      => Order::count(),
            'pending_orders'    => Order::where('status', 'pending_quote')->count(),
            'active_orders'     => Order::whereIn('status', ['in_progress', 'quote_accepted'])->count(),
            'completed_orders'  => Order::where('status', 'completed')->count(),
            'total_revenue'     => Order::where('status', 'completed')->sum('total_price'),
            'pending_approvals' => PortfolioItem::where('status', 'pending')->count(),
            'total_portfolio'   => PortfolioItem::where('status', 'approved')->count(),
        ]);
    }

    // GET /api/v1/admin/orders
    // يطابق: api.getAdminOrders()
    public function orders()
    {
        return response()->json(
            Order::with(['customer:id,first_name,last_name,email', 'tailor:id,first_name,last_name'])
                ->orderByDesc('created_at')
                ->get()
        );
    }

    // PUT /api/v1/admin/users/{id}/wallet
    // يطابق: api.updateUserWallet(userId, action, amount)
    public function updateUserWallet(Request $request, int $id, WalletService $walletService)
    {
        $request->validate([
            'action' => 'required|in:add,deduct',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = User::findOrFail($id);

        if ($request->action === 'add') {
            $walletService->topUp($user, $request->amount, 'Admin top-up');
        } else {
            $walletService->deduct($user, $request->amount, 'Admin deduction');
        }

        return response()->json($user->fresh()->toApiResponse());
    }
}
```

### 5.6 AiController (CR-01 - Gemini Proxy)

```php
class AiController extends Controller
{
    // POST /api/v1/ai/generate-image
    // ينقل مفتاح Gemini للـ Backend بدلاً من تسريبه في الفرونت
    public function generateImage(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|max:2000',
            'parts'  => 'nullable|array',
        ]);

        $apiKey = config('services.gemini.api_key');
        if (!$apiKey) {
            abort(503, 'AI service not configured.');
        }

        $response = Http::timeout(60)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={$apiKey}",
            [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $request->prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseModalities' => ['TEXT', 'IMAGE'],
                ],
            ]
        );

        if ($response->failed()) {
            abort(502, 'AI generation failed.');
        }

        return response()->json($response->json());
    }
}
```

### 5.7 ReviewController (NB-12 - التقييمات)

```php
class ReviewController extends Controller
{
    // GET /api/v1/products/{id}/reviews
    public function index(int $id)
    {
        $item = PortfolioItem::findOrFail($id);

        return response()->json(
            $item->reviews()
                ->with('user:id,first_name,last_name')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($r) => [
                    'author'  => $r->user->first_name . ' ' . $r->user->last_name,
                    'rating'  => $r->rating,
                    'comment' => $r->comment,
                ])
        );
    }

    // POST /api/v1/products/{id}/reviews
    public function store(Request $request, int $id)
    {
        $item = PortfolioItem::findOrFail($id);

        $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        // منع التقييم المتكرر
        $existing = $item->reviews()->where('user_id', $request->user()->id)->first();
        if ($existing) {
            abort(409, 'You already reviewed this product.');
        }

        $review = $item->reviews()->create([
            'user_id' => $request->user()->id,
            'rating'  => $request->rating,
            'comment' => $request->comment,
        ]);

        return response()->json([
            'author'  => $request->user()->first_name . ' ' . $request->user()->last_name,
            'rating'  => $review->rating,
            'comment' => $review->comment,
        ], 201);
    }
}
```

---

## المرحلة 6: الخدمات (Services)
**الجهد: 2-3 ساعات**

### 6.1 WalletService (CR-07 - التحقق من الرصيد)

```php
class WalletService
{
    public function topUp(User $user, float $amount, string $description = 'Wallet top-up'): User
    {
        return DB::transaction(function () use ($user, $amount, $description) {
            $user->increment('balance', $amount);
            $user->refresh();

            WalletTransaction::create([
                'user_id'       => $user->id,
                'type'          => 'credit',
                'amount'        => $amount,
                'description'   => $description,
                'balance_after' => $user->balance,
            ]);

            return $user;
        });
    }

    public function deduct(User $user, float $amount, string $description = 'Payment'): User
    {
        if ($user->balance < $amount) {
            abort(422, 'Insufficient balance.');
        }

        return DB::transaction(function () use ($user, $amount, $description) {
            $user->decrement('balance', $amount);
            $user->refresh();

            WalletTransaction::create([
                'user_id'       => $user->id,
                'type'          => 'debit',
                'amount'        => $amount,
                'description'   => $description,
                'balance_after' => $user->balance,
            ]);

            return $user;
        });
    }
}
```

### 6.2 FileUploadService (NB-01 + NB-08)

```php
class FileUploadService
{
    public function upload(UploadedFile $file, User $user): string
    {
        $folder = $this->getFolder($file->getMimeType());
        $path = $file->store("uploads/{$folder}", 'public');

        Media::create([
            'user_id'    => $user->id,
            'file_path'  => $path,
            'file_name'  => $file->getClientOriginalName(),
            'mime_type'  => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
        ]);

        return asset("storage/{$path}");
    }

    private function getFolder(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'video/')) return 'videos';
        return 'images';
    }
}
```

---

## المرحلة 7: Seeders (بيانات أولية)
**الجهد: 2-3 ساعات**

### 7.1 DatabaseSeeder

```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            DressPartSeeder::class,
            PaymentMethodSeeder::class,
            SocialLinkSeeder::class,
            SettingsSeeder::class,
            CategorySeeder::class,
            ShippingPolicySeeder::class,
        ]);
    }
}
```

### 7.2 UserSeeder (حسابات أولية)

```php
class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Manager (المدير)
        User::create([
            'first_name' => 'سحر',
            'last_name'  => 'القطرنجي',
            'email'      => 'admin@modeya.com',
            'password'   => Hash::make('Modeya@2026'),
            'role'       => 'manager',
            'balance'    => 0,
            'is_active'  => true,
        ]);

        // Designer (مصممة)
        User::create([
            'first_name' => 'مصممة',
            'last_name'  => 'تجريبية',
            'email'      => 'designer@modeya.com',
            'password'   => Hash::make('Modeya@2026'),
            'role'       => 'designer',
            'balance'    => 0,
            'is_active'  => true,
        ]);

        // Tailor (خياطة)
        User::create([
            'first_name' => 'خياطة',
            'last_name'  => 'تجريبية',
            'email'      => 'tailor@modeya.com',
            'password'   => Hash::make('Modeya@2026'),
            'role'       => 'tailor',
            'balance'    => 0,
            'is_active'  => true,
        ]);

        // Customer (زبونة)
        User::create([
            'first_name' => 'زبونة',
            'last_name'  => 'تجريبية',
            'email'      => 'customer@modeya.com',
            'password'   => Hash::make('Modeya@2026'),
            'role'       => 'customer',
            'balance'    => 500,
            'is_active'  => true,
        ]);
    }
}
```

### 7.3 DressPartSeeder

```php
class DressPartSeeder extends Seeder
{
    public function run(): void
    {
        $parts = [
            ['name' => 'V-Neck',         'category' => 'front_neckline'],
            ['name' => 'Sweetheart',      'category' => 'front_neckline'],
            ['name' => 'Off-Shoulder',    'category' => 'front_neckline'],
            ['name' => 'Halter',          'category' => 'front_neckline'],
            ['name' => 'Low Back',        'category' => 'back_neckline'],
            ['name' => 'Open Back',       'category' => 'back_neckline'],
            ['name' => 'Keyhole',         'category' => 'back_neckline'],
            ['name' => 'Silk',            'category' => 'fabrics'],
            ['name' => 'Lace',            'category' => 'fabrics'],
            ['name' => 'Tulle',           'category' => 'fabrics'],
            ['name' => 'Satin',           'category' => 'fabrics'],
            ['name' => 'A-Line',          'category' => 'skirt_styles'],
            ['name' => 'Mermaid',         'category' => 'skirt_styles'],
            ['name' => 'Ball Gown',       'category' => 'skirt_styles'],
            ['name' => 'Chapel Train',    'category' => 'train'],
            ['name' => 'Cathedral Train', 'category' => 'train'],
            ['name' => 'No Train',        'category' => 'train'],
        ];

        foreach ($parts as $i => $part) {
            DressPart::create([
                'name'       => $part['name'],
                'category'   => $part['category'],
                'is_active'  => true,
                'sort_order' => $i,
            ]);
        }
    }
}
```

### 7.4 PaymentMethodSeeder

```php
class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        PaymentMethod::create([
            'name'            => 'Credit Card',
            'translation_key' => 'payment_credit_card',
            'is_active'       => true,
            'img_url'         => '/icons/credit-card.svg',
            'type'            => 'card',
        ]);

        PaymentMethod::create([
            'name'            => 'Bank Transfer',
            'translation_key' => 'payment_bank_transfer',
            'is_active'       => true,
            'img_url'         => '/icons/bank-transfer.svg',
            'type'            => 'bank',
            'details'         => json_encode([
                'bank_name'      => 'Bank Name',
                'account_number' => '...',
                'iban'           => '...',
            ]),
        ]);

        PaymentMethod::create([
            'name'            => 'Al Baraka Bank',
            'translation_key' => 'payment_baraka',
            'is_active'       => true,
            'img_url'         => '/icons/baraka-bank.svg',
            'type'            => 'bank',
            'details'         => json_encode([
                'bank_name'      => 'Al Baraka Bank',
                'account_number' => '...',
                'iban'           => '...',
            ]),
        ]);

        PaymentMethod::create([
            'name'            => 'Wallet',
            'translation_key' => 'payment_wallet',
            'is_active'       => true,
            'img_url'         => '/icons/wallet.svg',
            'type'            => 'wallet',
        ]);
    }
}
```

### 7.5 CategorySeeder (NB-07 - تصنيفات الفساتين)

```php
class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Long Dresses',   'name_ar' => 'فساتين طويلة',  'slug' => 'long'],
            ['name' => 'Short Dresses',  'name_ar' => 'فساتين قصيرة',  'slug' => 'short'],
            ['name' => 'Summer Dresses', 'name_ar' => 'فساتين صيفية',  'slug' => 'summer'],
            ['name' => 'Winter Dresses', 'name_ar' => 'فساتين شتوية',  'slug' => 'winter'],
            ['name' => 'Spring Dresses', 'name_ar' => 'فساتين ربيعية', 'slug' => 'spring'],
            ['name' => 'Autumn Dresses', 'name_ar' => 'فساتين خريفية', 'slug' => 'autumn'],
        ];

        foreach ($categories as $cat) {
            Category::create(array_merge($cat, ['is_active' => true]));
        }
    }
}
```

### 7.6 SettingsSeeder

```php
class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'site_name',    'value' => 'MODEYA',            'is_public' => true],
            ['key' => 'site_email',   'value' => 'info@modeya.com',   'is_public' => true],
            ['key' => 'site_phone',   'value' => '+963-XXX-XXX-XXXX', 'is_public' => true],
            ['key' => 'site_address', 'value' => 'Syria',             'is_public' => true],
            ['key' => 'currency',     'value' => 'SYP',               'is_public' => true],
            ['key' => 'stripe_key',   'value' => '',                  'is_public' => true],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }
    }
}
```

---

## المرحلة 8: Form Request Validation
**الجهد: 2-3 ساعات**

### 8.1 قائمة الـ Form Requests

| Request Class | الـ Controller | القواعد |
|--------------|---------------|---------|
| `LoginRequest` | AuthController@login | email: required, password: required |
| `RegisterRequest` | AuthController@register | email: unique:users, password: min:8, first_name, last_name |
| `UpdateProfileRequest` | AuthController@updateMe | email: unique (except self), phone, bio, etc. |
| `ChangePasswordRequest` | AuthController@changePassword | old_password, new_password: min:8, confirmed |
| `TopUpWalletRequest` | WalletController@topUp | amount: numeric, min:1, max:100000 |
| `CreateDesignRequest` | DesignController@store | name, design_type, image_url |
| `CreateOrderRequest` | OrderController@store | design_type, tailor_id (optional), selected_parts, notes |
| `UpdateOrderStatusRequest` | OrderController@updateStatus | status: in valid statuses |
| `SendMessageRequest` | OrderMessageController@store | text: max:5000 |
| `UploadFileRequest` | UploadController@store | file: max:102400 |
| `CreateReviewRequest` | ReviewController@store | rating: 1-5, comment: max:1000 |
| `CreatePortfolioRequest` | PortfolioController@store | title, description, price, images |
| `CreatePaymentMethodRequest` | PaymentMethodController@store | name, type |
| `UpdateSocialLinksRequest` | SocialLinkController@update | links: array of {name, href, is_enabled} |

---

## المرحلة 9: خريطة التطابق الكاملة (Frontend ↔ Backend)
**هذا الجدول هو "عقد" التطوير - كل سطر يجب أن يعمل**

### 9.1 Endpoints الموجودة في الفرونت (يجب تنفيذها جميعاً)

| # | Frontend Call (api.ts) | HTTP | Backend Route | Controller@Method | الحالة |
|---|------------------------|------|---------------|-------------------|--------|
| 1 | `api.login(email, pw)` | POST | `/auth/login` | Auth@login | مطلوب |
| 2 | `api.register(data)` | POST | `/auth/register` | Auth@register | مطلوب |
| 3 | `api.getMe()` | GET | `/auth/me` | Auth@me | مطلوب |
| 4 | `api.updateMe(data)` | PUT | `/auth/me` | Auth@updateMe | مطلوب |
| 5 | `api.changePassword(old, new)` | PUT | `/auth/change-password` | Auth@changePassword | مطلوب |
| 6 | `api.getWallet()` | GET | `/wallet` | Wallet@show | مطلوب |
| 7 | `api.topUpWallet(amount)` | POST | `/wallet/top-up` | Wallet@topUp | مطلوب |
| 8 | `api.getParts(category?)` | GET | `/parts` | DressPart@index | مطلوب |
| 9 | `api.getDesigns(isPublic)` | GET | `/designs?is_public=` | Design@index | مطلوب |
| 10 | `api.getMyDesigns()` | GET | `/designs?is_public=false` | Design@index | مطلوب |
| 11 | `api.createDesign(data)` | POST | `/designs` | Design@store | مطلوب |
| 12 | `api.deleteDesign(id)` | DELETE | `/designs/{id}` | Design@destroy | مطلوب |
| 13 | `api.getOrders()` | GET | `/orders` | Order@index | مطلوب |
| 14 | `api.createOrder(data)` | POST | `/orders` | Order@store | مطلوب |
| 15 | `api.getOrderDetail(id)` | GET | `/orders/{id}` | Order@show | مطلوب |
| 16 | `api.updateOrderStatus(id, status)` | PUT | `/orders/{id}/status` | Order@updateStatus | مطلوب |
| 17 | `api.cancelOrder(id)` | DELETE | `/orders/{id}` | Order@destroy | مطلوب |
| 18 | `api.getAdminStats()` | GET | `/admin/stats` | Admin@stats | مطلوب |
| 19 | `api.getAdminOrders()` | GET | `/admin/orders` | Admin@orders | مطلوب |
| 20 | `api.updateUserWallet(id, action, amt)` | PUT | `/admin/users/{id}/wallet` | Admin@updateUserWallet | مطلوب |
| 21 | `api.getPaymentMethods()` | GET | `/admin/payment-methods` | PaymentMethod@index | مطلوب |
| 22 | `api.createPaymentMethod(data)` | POST | `/admin/payment-methods` | PaymentMethod@store | مطلوب |
| 23 | `api.updatePaymentMethod(id, data)` | PUT | `/admin/payment-methods/{id}` | PaymentMethod@update | مطلوب |
| 24 | `api.deletePaymentMethod(id)` | DELETE | `/admin/payment-methods/{id}` | PaymentMethod@destroy | مطلوب |
| 25 | `api.getSocialLinks()` | GET | `/admin/social-links` | SocialLink@index | مطلوب |
| 26 | `api.updateSocialLinks(links)` | PUT | `/admin/social-links` | SocialLink@update | مطلوب |
| 27 | `api.getPublicSettings()` | GET | `/admin/settings/public` | Settings@publicSettings | مطلوب |
| 28 | `api.getPortfolio()` | GET | `/portfolio` | Portfolio@index | مطلوب |
| 29 | `api.getPendingPortfolio()` | GET | `/portfolio/pending` | Portfolio@pending | مطلوب |
| 30 | `api.createPortfolioItem(data)` | POST | `/portfolio` | Portfolio@store | مطلوب |
| 31 | `api.approvePortfolioItem(id)` | PUT | `/portfolio/{id}/approve` | Portfolio@approve | مطلوب |
| 32 | `api.rejectPortfolioItem(id)` | PUT | `/portfolio/{id}/reject` | Portfolio@reject | مطلوب |
| 33 | `api.getUsers(role?)` | GET | `/users?role=` | User@index | مطلوب |
| 34 | `api.deleteUser(id)` | DELETE | `/users/{id}` | User@destroy | مطلوب |
| 35 | `api.getTransactions()` | GET | `/transactions` | Transaction@index | مطلوب |

### 9.2 Endpoints جديدة (غير موجودة في الفرونت بعد)

| # | الوصف | HTTP | Backend Route | يحل مشكلة | يحتاج تعديل فرونت |
|---|-------|------|---------------|-----------|-------------------|
| 36 | رفع ملفات | POST | `/upload` | NB-01, NB-08, H-04 | نعم: `api.uploadImage()` |
| 37 | جلب رسائل طلب | GET | `/orders/{id}/messages` | NB-04, BUG-10 | نعم: `api.getOrderMessages()` |
| 38 | إرسال رسالة | POST | `/orders/{id}/messages` | NB-04, BUG-10 | نعم: `api.sendMessage()` |
| 39 | توليد صورة AI | POST | `/ai/generate-image` | CR-01 | نعم: استبدال Gemini call |
| 40 | عرض تصنيفات | GET | `/categories` | CR-09, BUG-09 | نعم: `api.getCategories()` |
| 41 | إضافة تصنيف | POST | `/admin/categories` | CR-09 | نعم |
| 42 | تعديل تصنيف | PUT | `/admin/categories/{id}` | CR-09 | نعم |
| 43 | حذف تصنيف | DELETE | `/admin/categories/{id}` | CR-09 | نعم |
| 44 | إضافة جزء فستان | POST | `/admin/parts` | BUG-08 | نعم |
| 45 | تعديل جزء فستان | PUT | `/admin/parts/{id}` | BUG-08 | نعم |
| 46 | حذف جزء فستان | DELETE | `/admin/parts/{id}` | BUG-08 | نعم |
| 47 | جلب تقييمات منتج | GET | `/products/{id}/reviews` | NB-12 | نعم: `api.getReviews()` |
| 48 | إضافة تقييم | POST | `/products/{id}/reviews` | NB-12 | نعم: `api.submitReview()` |
| 49 | عرض سياسات الشحن | GET | `/shipping-policies` | NB-09 | نعم |
| 50 | إدارة سياسات الشحن | POST/PUT/DELETE | `/admin/shipping-policies` | NB-09 | نعم |

**المجموع: 50 endpoint (35 موجود + 15 جديد)**

---

## المرحلة 10: متطلبات PHP Extensions
**مطلوب على اللابتوب الثاني**

### 10.1 الحد الأدنى

```ini
; php.ini - يجب تفعيل هذه الإضافات
extension=pdo_sqlite
extension=sqlite3
extension=fileinfo
extension=openssl
extension=mbstring
extension=tokenizer
extension=curl
extension=gd          ; لمعالجة الصور (resize, thumbnails)
```

### 10.2 فحص المتطلبات في setup.bat

```batch
REM Check required PHP extensions
php -m | findstr /i "pdo_sqlite" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] pdo_sqlite extension not enabled.
    echo Enable it in php.ini: extension=pdo_sqlite
)
```

---

## خطة التنفيذ الزمنية

### المرحلة A: الأساس (3-5 أيام) — 15-20 ساعة

| اليوم | المهمة | الساعات |
|-------|--------|---------|
| 1 | إنشاء المشروع + .env + CORS + route prefix + batch files | 2-3 |
| 1 | كتابة الـ 17 migration + تشغيلها | 3-4 |
| 2 | كتابة الـ 16 model مع العلاقات + toApiResponse | 2-3 |
| 2 | AuthController كامل (login, register, me, update, password) | 2-3 |
| 3 | WalletController + WalletService + TransactionController | 2-3 |
| 3 | Seeders (6 ملفات) + تشغيل وتجربة | 2-3 |
| 3 | RoleMiddleware + تسجيل في bootstrap | 1 |

### المرحلة B: الـ CRUD الأساسي (3-4 أيام) — 12-16 ساعة

| اليوم | المهمة | الساعات |
|-------|--------|---------|
| 4 | DressPartController (index + store/update/destroy للمدير) | 2 |
| 4 | DesignController (index + store + destroy) | 2 |
| 4 | OrderController (index + store + show + updateStatus + destroy) | 3 |
| 5 | PortfolioController (index + store + pending + approve + reject) | 3 |
| 5 | AdminController (stats + orders + updateUserWallet) | 2 |
| 6 | PaymentMethodController + SocialLinkController + SettingsController | 3 |
| 6 | UserController + CategoryController | 2 |

### المرحلة C: الميزات الجديدة (2-3 أيام) — 8-12 ساعة

| اليوم | المهمة | الساعات |
|-------|--------|---------|
| 7 | UploadController + FileUploadService (صور + فيديو) | 3-4 |
| 7 | OrderMessageController (المحادثة) | 2-3 |
| 8 | ReviewController (التقييمات) | 2 |
| 8 | AiController (Gemini proxy) | 1-2 |
| 8 | ShippingPolicyController | 1-2 |

### المرحلة D: الاختبار والتوثيق (1-2 يوم) — 4-6 ساعة

| اليوم | المهمة | الساعات |
|-------|--------|---------|
| 9 | اختبار كل endpoint مع الفرونت | 3-4 |
| 9 | إصلاح أي مشاكل CORS أو Response shape | 1-2 |

---

## إجمالي الجهد المقدر

| المرحلة | الجهد |
|---------|-------|
| A: الأساس | 15-20 ساعة |
| B: CRUD | 12-16 ساعة |
| C: ميزات جديدة | 8-12 ساعة |
| D: اختبار | 4-6 ساعة |
| **المجموع** | **39-54 ساعة** |
| **بالأيام** | **9-12 يوم عمل** |

---

## ملاحظات مهمة

### 1. التوافق مع الفرونت
- **لا تعديل على `API_BASE`**: Laravel يخدم على `http://localhost:8000` افتراضياً
- **لا تعديل على `getHeaders()`**: Sanctum يقبل `Bearer {token}` في header
- **شكل الـ Response يجب أن يطابق بالضبط** ما يتوقعه الفرونت (راجع جدول 9.1)
- **Error format**: الفرونت يبحث عن `error.detail` (خطأ 51 في api.ts) — يجب أن يرجع الباك إند:
  ```json
  { "detail": "Error message here" }
  ```

### 2. SQLite vs MySQL
- **SQLite** مختار للنقل السهل بين الأجهزة (ملف واحد)
- إذا احتاج المشروع MySQL لاحقاً: فقط تغيير `.env` (DB_CONNECTION=mysql)
- SQLite لا يدعم `enum` في بعض الحالات — نستخدم `string` مع validation بدلاً من database enum

### 3. رفع الملفات
- الملفات تُخزن في `storage/app/public/uploads/`
- يجب تشغيل `php artisan storage:link` (موجود في setup.bat)
- الحد الأقصى للملف: 100MB (قابل للتعديل في `.env`)
- أنواع الصور: jpg, png, webp, gif
- أنواع الفيديو: mp4, webm, mov (NB-08)

### 4. المحادثة (NB-04)
- المرحلة الأولى: **HTTP Polling** (أبسط — الفرونت يسأل كل 5 ثوان)
- المرحلة الثانية (اختياري): **Laravel Reverb** (WebSocket) لتحديثات فورية
- HTTP Polling كافي للمرحلة الأولى

### 5. Gemini AI Proxy (CR-01)
- المفتاح يُخزن في `.env` (GEMINI_API_KEY)
- الفرونت يرسل prompt للـ backend بدلاً من استدعاء Gemini مباشرة
- يحل مشكلة تسريب المفتاح في `vite.config.ts`

### 6. حسابات الاختبار الأولية

| الدور | الإيميل | كلمة المرور |
|-------|---------|-------------|
| Manager | admin@modeya.com | Modeya@2026 |
| Designer | designer@modeya.com | Modeya@2026 |
| Tailor | tailor@modeya.com | Modeya@2026 |
| Customer | customer@modeya.com | Modeya@2026 |

---

## Error Handling Convention

الفرونت يتوقع هذا الشكل للأخطاء (من `api.ts:51`):
```javascript
const error = await response.json().catch(() => ({ detail: 'Request failed' }));
throw new Error(error.detail || `HTTP ${response.status}`);
```

لذلك كل أخطاء الباك إند يجب أن تُرجع:
```php
// في app/Exceptions/Handler.php أو عبر middleware
return response()->json([
    'detail' => $exception->getMessage(),
], $statusCode);
```

أو عبر `abort()`:
```php
abort(422, 'Insufficient balance.');
// يُنتج: { "detail": "Insufficient balance." }
```

---

## ملحق: الـ Frontend API Methods المطلوب إضافتها

هذه الـ methods يجب إضافتها في `services/api.ts` لتتوافق مع الـ endpoints الجديدة:

```typescript
// === الإضافات المطلوبة على services/api.ts ===

// NB-01: رفع ملفات
async uploadFile(file: File, type: 'image' | 'video' = 'image'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
}

// NB-04: رسائل الطلب (المحادثة)
async getOrderMessages(orderId: number): Promise<any[]> {
    return this.request<any[]>(`/orders/${orderId}/messages`);
}

async sendOrderMessage(orderId: number, text: string): Promise<any> {
    return this.request<any>(`/orders/${orderId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
    });
}

// CR-01: توليد صورة AI
async generateAiImage(prompt: string, parts?: Record<string, unknown>): Promise<any> {
    return this.request<any>('/ai/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt, parts }),
    });
}

// CR-09: التصنيفات
async getCategories(): Promise<any[]> {
    return this.request<any[]>('/categories');
}

// NB-12: التقييمات
async getProductReviews(productId: number): Promise<any[]> {
    return this.request<any[]>(`/products/${productId}/reviews`);
}

async submitReview(productId: number, data: { rating: number; comment: string }): Promise<any> {
    return this.request<any>(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// NB-09: سياسات الشحن
async getShippingPolicies(): Promise<any[]> {
    return this.request<any[]>('/shipping-policies');
}
```

---

## ملحق: هيكل الملفات الكامل للباك إند

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           ├── AuthController.php
│   │   │           ├── WalletController.php
│   │   │           ├── DressPartController.php
│   │   │           ├── DesignController.php
│   │   │           ├── OrderController.php
│   │   │           ├── OrderMessageController.php
│   │   │           ├── PortfolioController.php
│   │   │           ├── AdminController.php
│   │   │           ├── PaymentMethodController.php
│   │   │           ├── SocialLinkController.php
│   │   │           ├── SettingsController.php
│   │   │           ├── UserController.php
│   │   │           ├── TransactionController.php
│   │   │           ├── UploadController.php
│   │   │           ├── ReviewController.php
│   │   │           ├── CategoryController.php
│   │   │           ├── ShippingPolicyController.php
│   │   │           └── AiController.php
│   │   ├── Middleware/
│   │   │   └── RoleMiddleware.php
│   │   └── Requests/
│   │       ├── Auth/
│   │       │   ├── LoginRequest.php
│   │       │   ├── RegisterRequest.php
│   │       │   ├── UpdateProfileRequest.php
│   │       │   └── ChangePasswordRequest.php
│   │       ├── Wallet/
│   │       │   └── TopUpRequest.php
│   │       ├── Order/
│   │       │   ├── CreateOrderRequest.php
│   │       │   ├── UpdateStatusRequest.php
│   │       │   └── SendMessageRequest.php
│   │       ├── Design/
│   │       │   └── CreateDesignRequest.php
│   │       ├── Portfolio/
│   │       │   └── CreatePortfolioRequest.php
│   │       ├── Review/
│   │       │   └── CreateReviewRequest.php
│   │       └── Upload/
│   │           └── UploadFileRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Category.php
│   │   ├── DressPart.php
│   │   ├── Design.php
│   │   ├── Order.php
│   │   ├── OrderMessage.php
│   │   ├── PortfolioItem.php
│   │   ├── PortfolioImage.php
│   │   ├── PortfolioSize.php
│   │   ├── PaymentMethod.php
│   │   ├── SocialLink.php
│   │   ├── Setting.php
│   │   ├── WalletTransaction.php
│   │   ├── Review.php
│   │   ├── ShippingPolicy.php
│   │   └── Media.php
│   └── Services/
│       ├── WalletService.php
│       ├── FileUploadService.php
│       └── GeminiService.php
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_personal_access_tokens_table.php
│   │   ├── 2026_05_22_000001_create_categories_table.php
│   │   ├── 2026_05_22_000002_create_dress_parts_table.php
│   │   ├── 2026_05_22_000003_create_designs_table.php
│   │   ├── 2026_05_22_000004_create_portfolio_items_table.php
│   │   ├── 2026_05_22_000005_create_portfolio_images_table.php
│   │   ├── 2026_05_22_000006_create_portfolio_sizes_table.php
│   │   ├── 2026_05_22_000007_create_orders_table.php
│   │   ├── 2026_05_22_000008_create_order_messages_table.php
│   │   ├── 2026_05_22_000009_create_payment_methods_table.php
│   │   ├── 2026_05_22_000010_create_social_links_table.php
│   │   ├── 2026_05_22_000011_create_settings_table.php
│   │   ├── 2026_05_22_000012_create_wallet_transactions_table.php
│   │   ├── 2026_05_22_000013_create_reviews_table.php
│   │   ├── 2026_05_22_000014_create_shipping_policies_table.php
│   │   └── 2026_05_22_000015_create_media_table.php
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── UserSeeder.php
│       ├── DressPartSeeder.php
│       ├── PaymentMethodSeeder.php
│       ├── SocialLinkSeeder.php
│       ├── SettingsSeeder.php
│       ├── CategorySeeder.php
│       └── ShippingPolicySeeder.php
├── routes/
│   └── api.php
├── config/
│   ├── cors.php
│   └── services.php          ← gemini.api_key
├── storage/
│   └── app/
│       └── public/
│           └── uploads/
│               ├── images/
│               └── videos/
├── .env.example
├── composer.json
└── artisan
```

**عدد الملفات المطلوب كتابتها: ~60 ملف**
- 18 Controller
- 16 Model
- 17 Migration
- 8 Seeder
- 14 Form Request
- 3 Service
- 1 Middleware
- 1 Routes file (api.php)

---

## نهاية الخطة

هذه الخطة تغطي بناء باك إند Laravel كامل يخدم الفرونت الحالي **بدون أي تعديل** على `API_BASE` أو `getHeaders()`. كل الـ 35 endpoint الموجودة + 15 endpoint جديدة مغطاة.

**أولوية التنفيذ**: المرحلة A (الأساس) → المرحلة B (CRUD) → المرحلة C (ميزات جديدة) → المرحلة D (اختبار)

**ملفات التشغيل** (`setup.bat`, `start.bat`, `clear.bat`) تضمن أي شخص يقدر يشغّل المشروع بضغطة واحدة.
