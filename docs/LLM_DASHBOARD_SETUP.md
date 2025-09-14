# 🚀 מדריך התקנה - שילוב LLM בדשבורד ניהול

## 📋 סקירה כללית

מדריך זה יסייע לך להתקין ולהגדיר מערכת AI חכמה בדשבורד הניהול של Strong Luxury Cars.

## 🎯 מה נבנה

- **תיבת צ'אט חכמה** בדשבורד הניהול
- **חיבור OpenAI GPT-4o-mini** דרך Vercel AI SDK
- **חיבור גיבוי Hugging Face API** עם מודלים חינמיים
- **ניתוח נתונים עסקיים** עם AI
- **מערכת מעקב עלויות** ומעבר ל-Pay-As-You-Go

## 🛠️ דרישות מערכת

- Node.js 18+ 
- Next.js 14+
- מפתח OpenAI API
- מפתח Hugging Face API (אופציונלי)

## 📦 התקנת חבילות

```bash
# התקנת Vercel AI SDK
npm install ai @ai-sdk/openai

# התקנת חבילות נוספות
npm install axios lucide-react

# התקנת חבילות פיתוח
npm install -D @types/node
```

## 🔑 הגדרת Environment Variables

צור קובץ `.env.local`:

```env
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# ספק ברירת מחדל
AI_PROVIDER_DEFAULT=auto   # auto | openai | hf

# Hugging Face API (אופציונלי)
HUGGINGFACE_API_KEY=hf_your-huggingface-api-key
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3

# שליטה בשימוש/עלויות
ALLOW_PAID=false             # false=עצור אחרי חינם; true=המשך בתשלום
FREE_DAILY_REQ_LIMIT=200     # בקשות/יום (לצורך ניטור פשוט)
FREE_DAILY_TOKENS=10000      # טוקנים/יום (הערכה)
RATE_LIMIT_RPM=20            # בקשות לדקה לכל משתמש

# אזור זמן למכסה יומית
TZ=Asia/Jerusalem

# Supabase (לשמירת היסטוריית שיחות)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🏗️ מבנה הפרויקט

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API endpoint לצ'אט
│   └── dashboard/
│       └── ai-chat/
│           └── page.tsx          # דף הצ'אט
├── components/
│   ├── ai/
│   │   ├── ChatInterface.tsx     # קומפוננטת צ'אט
│   │   ├── MessageBubble.tsx     # בועת הודעה
│   │   └── ChatHistory.tsx       # היסטוריית שיחות
│   └── ui/
│       ├── Button.tsx
│       └── Input.tsx
└── lib/
    ├── ai.ts                     # הגדרות AI
    ├── huggingface.ts            # חיבור Hugging Face
    └── utils.ts
```

## 🚀 שלבי התקנה

### שלב 1: יצירת API Route

צור קובץ `src/app/api/ai/chat/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting (Token Bucket)
const rateLimitMap = new Map<string, { tokens: number; lastRefill: number }>();

export async function POST(req: NextRequest) {
  try {
    // בדיקת הרשאות
    const user = await checkAuth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ 
        error: 'חרגת ממגבלת הבקשות לדקה' 
      }, { status: 429 });
    }

    // בדיקת מכסה יומית
    if (!checkDailyLimit(user.id)) {
      return NextResponse.json({ 
        error: 'המכסה היומית נוצלה',
        allowPaid: process.env.ALLOW_PAID === 'true'
      }, { status: 429 });
    }

    const { messages, provider = 'auto', stream = true } = await req.json();

    let result;
    let fallbackUsed = false;

    try {
      // נסה OpenAI תחילה
      if (provider === 'auto' || provider === 'openai') {
        result = await streamText({
          model: openai('gpt-4o-mini'),
          messages,
          maxTokens: 1000,
        });
      } else {
        throw new Error('OpenAI לא זמין');
      }
    } catch (error) {
      // Fallback ל-Hugging Face
      if (provider === 'auto') {
        fallbackUsed = true;
        result = await callHuggingFace(messages);
      } else {
        throw error;
      }
    }

    // עדכון סטטיסטיקות שימוש
    await updateUsageStats(user.id, result.usage);

    if (stream) {
      return result.toDataStreamResponse();
    } else {
      return NextResponse.json({
        id: `chat_${Date.now()}`,
        provider: fallbackUsed ? 'hf' : 'openai',
        content: await result.text,
        fallback_used: fallbackUsed,
        usage: result.usage
      });
    }

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ 
      error: 'שגיאה בשירות AI',
      fallback_suggested: true 
    }, { status: 503 });
  }
}

// פונקציות עזר
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId) || { tokens: 20, lastRefill: now };
  
  // Refill tokens (20 per minute)
  const timePassed = now - userLimit.lastRefill;
  const tokensToAdd = Math.floor(timePassed / 60000) * 20;
  userLimit.tokens = Math.min(20, userLimit.tokens + tokensToAdd);
  userLimit.lastRefill = now;

  if (userLimit.tokens > 0) {
    userLimit.tokens--;
    rateLimitMap.set(userId, userLimit);
    return true;
  }
  
  return false;
}

async function checkDailyLimit(userId: string): Promise<boolean> {
  // בדיקה בבסיס נתונים או cache
  // החזר true אם יש מכסה, false אם נוצלה
  return true; // Placeholder
}

async function callHuggingFace(messages: any[]) {
  // יישום קריאה ל-Hugging Face API
  // החזר תגובה בפורמט דומה ל-streamText
  throw new Error('Hugging Face לא מוגדר עדיין');
}

async function updateUsageStats(userId: string, usage: any) {
  // עדכון סטטיסטיקות שימוש בבסיס נתונים
}
```

### שלב 2: יצירת קומפוננטת צ'אט

צור קובץ `src/components/ai/ChatInterface.tsx`:

```typescript
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ProviderToggle } from './ProviderToggle';

export function ChatInterface() {
  const [provider, setProvider] = useState<'auto' | 'openai' | 'hf'>('auto');
  
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading,
    error 
  } = useChat({
    api: '/api/ai/chat',
    body: {
      provider,
    },
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header עם Provider Toggle */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <ProviderToggle 
            value={provider} 
            onChange={setProvider}
          />
        </div>
      </div>

      {/* הודעות */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>ברוכים הבאים! שאלו אותי כל שאלה על הנתונים שלכם.</p>
            <p className="text-sm mt-2">לדוגמה: "איזה רכבים נמכרו הכי הרבה החודש?"</p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message}
            showProvider={provider === 'auto'}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* הודעת שגיאה */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <div className="text-red-600 text-sm">
            {error.message === '429' 
              ? 'המכסה היומית נוצלה. נסו שוב מחר או הפעילו תשלום.'
              : 'שגיאה בשירות AI. נסו שוב.'}
          </div>
        </div>
      )}
      
      {/* טופס שליחה */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="שאל שאלה על הנתונים שלך..."
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            dir="rtl"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'שולח...' : 'שלח'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### שלב 2.1: יצירת Provider Toggle

צור קובץ `src/components/ai/ProviderToggle.tsx`:

```typescript
'use client';

interface ProviderToggleProps {
  value: 'auto' | 'openai' | 'hf';
  onChange: (value: 'auto' | 'openai' | 'hf') => void;
}

export function ProviderToggle({ value, onChange }: ProviderToggleProps) {
  return (
    <div className="flex bg-gray-200 rounded-lg p-1">
      <button
        onClick={() => onChange('auto')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          value === 'auto' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Auto
      </button>
      <button
        onClick={() => onChange('openai')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          value === 'openai' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        OpenAI
      </button>
      <button
        onClick={() => onChange('hf')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          value === 'hf' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        HF
      </button>
    </div>
  );
}
```

### שלב 3: יצירת דף הצ'אט

צור קובץ `src/app/dashboard/ai-chat/page.tsx`:

```typescript
import { ChatInterface } from '@/components/ai/ChatInterface';

export default function AIChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-gray-600">שאל שאלות על הנתונים שלך</p>
      </div>
      
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
}
```

## 🔧 הגדרות נוספות

### הגדרת Tailwind CSS לתמיכה ב-RTL

עדכן `tailwind.config.js`:

```javascript
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'hebrew': ['Heebo', 'Assistant', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### הגדרת פונטים עבריים

הוסף ל-`src/app/layout.tsx`:

```typescript
import { Heebo, Assistant } from 'next/font/google';

const heebo = Heebo({ subsets: ['hebrew'] });
const assistant = Assistant({ subsets: ['hebrew'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} ${assistant.className}`}>
        {children}
      </body>
    </html>
  );
}
```

## 🧪 בדיקות וקריטריוני קבלה

### בדיקת חיבור OpenAI

```bash
# הרץ את הפרויקט
npm run dev

# פתח http://localhost:3000/dashboard/ai-chat
# נסה לשאול: "מה המצב?"
```

### בדיקת תמיכה בעברית

נסה שאלות בעברית:
- "איזה רכבים נמכרו הכי הרבה החודש?"
- "מה שיעור ההמרה של הלידים?"

### קריטריוני קבלה (Acceptance Criteria)

- [ ] **API Endpoint**: `POST /api/ai/chat` מחזיר תשובה תקינה מ-OpenAI, כולל streaming
- [ ] **Fallback**: בעת כשל OpenAI במצב Auto – מתבצע Fallback ל-HF, מסומן `fallback_used=true`
- [ ] **Rate Limiting**: Rate-Limit של 20 לדקה אוכף החזרת `429`
- [ ] **מכסה יומית**: מכסה יומית נאכפת עם reset בחצות `Asia/Jerusalem`
- [ ] **RTL Support**: UI ב-RTL מלא + הודעות שגיאה/חריגה ידידותיות
- [ ] **אבטחה**: אין חשיפת מפתחות בצד לקוח, וכל קריאה עוברת דרך API Route מאובטח
- [ ] **Provider Toggle**: מעבר בין Auto/OpenAI/HF עובד תקין
- [ ] **Error Handling**: הודעות שגיאה ברורות וידידותיות למשתמש
- [ ] **Loading States**: אינדיקטורי טעינה ברורים
- [ ] **Performance**: זמן תגובה P95 ≤ 5 שניות לתשובה קצרה

## 📊 מעקב אחר שימוש

### הוספת מעקב עלויות

```typescript
// src/lib/usage-tracker.ts
export class UsageTracker {
  static async trackUsage(tokens: number, cost: number) {
    // שמירה בבסיס נתונים
    // התראות על מגבלות
  }
}
```

## 🚨 פתרון בעיות נפוצות

### שגיאת API Key

```
Error: Invalid API key
```

**פתרון**: בדוק שהמפתח ב-`.env.local` נכון

### שגיאת CORS

```
Error: CORS policy
```

**פתרון**: וודא שהקובץ `route.ts` נמצא בנתיב הנכון

### בעיות RTL

**פתרון**: וודא שהוספת `dir="rtl"` ו-`lang="he"`

## 📈 שלבים הבאים

1. **הוספת Hugging Face API** כגיבוי
2. **שיפור ניתוח הנתונים** עם שאילתות מתקדמות
3. **הוספת הורדת דוחות** כ-PDF/Excel
4. **אינטגרציה עם Google Analytics**

## 🆘 תמיכה

אם נתקלת בבעיות:
1. בדוק את הלוגים בקונסול
2. וודא שכל החבילות מותקנות
3. בדוק את הגדרות ה-Environment Variables

---

**🎉 מזל טוב!** המערכת מוכנה לשימוש!
