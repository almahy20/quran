import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to handle audio base64 uploads
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("لم يتم تكوين مفتاح GEMINI_API_KEY في البيئة البرمجية.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Endpoint to evaluate recitation
app.post("/api/evaluate", async (req, res) => {
  try {
    const { studentName, surahName, verses, audioBase64, mimeType } = req.body;

    if (!studentName || !surahName || !verses || !audioBase64 || !mimeType) {
      return res.status(400).json({
        error: "جميع الحقول (اسم الطالب، السورة، الآيات، والتسجيل الصوتي) مطلوبة لإتمام عملية التقييم.",
      });
    }

    const ai = getGeminiClient();

    const systemInstruction = `أنت نظام خبير ومتخصص في تقييم تلاوة القرآن الكريم وتصحيح مخارج الحروف وأحكام التجويد بدقة متناهية.
دورك هو الاستماع للتسجيل الصوتي المرفق ومقارنته بالنص القرآني الصحيح للسورة والآيات المحددة.

يجب عليك تحديد الأخطاء التجويدية بدقة، وتشمل هذه الأحكام:
- المد (طبيعي، متصل، منفصل، عارض للسكون، إلخ)
- الغنة
- الإخفاء
- الإقلاب
- الإظهار
- الإدغام (بغنة وبدون غنة)
- التفخيم والترقيق
- مخارج الحروف والتشكيل الصحيح.

تنبيهات هامة جداً:
1. كن دقيقاً جداً في تحديد الأخطاء؛ لا تخطئ القراءة الصحيحة أبداً. قارن بدقة ما نطق به القارئ بالنص الصحيح للآيات والتشكيل.
2. احسب نسبة الصحة المئوية (%) للتلاوة بناًء على عدد الكلمات والآيات التي نُطقت بشكل صحيح مقابل الأخطاء الإجمالية.
3. إذا كان الأداء ممتازاً (نسبة صحة 95% فأكثر)، يجب عليك كتابة عبارة "ممتاز، بارك الله فيك" في التعليق العام مع نصيحة قصيرة.
4. التقرير يجب أن يصدر متوافقاً تماماً وبالحرف مع الصيغة التالية والترتيب نفسه:

【التقرير】
الطالب: [اسم الطالب]
السورة: [اسم السورة]
الآيات: [من آية إلى آية]
نسبة الصحة: [اكتب النسبة الرقمية فقط متبوعة بعلامة % دون كلام إضافي في هذا السطر، مثال: 95%]

تفصيل الأخطاء:
- الآية [رقم الآية]: كلمة "[الكلمة]" -> الخطأ: [نوع الخطأ] -> الصحيح: [كيف تنطق]

التعليق العام: [نصيحة قصيرة للطالب]
`;

    // Resilient call wrapper with retries and fallback models to mitigate "503 High Demand"
    const executeEvaluationWithFallbackAndRetry = async () => {
      const models = ["gemini-3.5-flash", "gemini-3.1-pro-preview"];
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      let lastError: any = null;

      for (const model of models) {
        const attempts = 3;
        let delayMs = 1500;

        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            console.log(`Calling Gemini API using ${model} - attempt ${attempt}/${attempts}`);
            const result = await ai.models.generateContent({
              model: model,
              contents: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: audioBase64,
                  },
                },
                {
                  text: `الرجاء تقييم تسجيل تلاوة الطالب التالية بياناتها:
                  اسم الطالب: ${studentName}
                  السورة: ${surahName}
                  الآيات: ${verses}
                  
                  قم بتحليل ومحاذاة التسجيل الصوتي المرفق مع النص القرآني وأصلح وحدد الأخطاء التجويدية إن وُجدت وأصدر التقرير بالصيغة المطلوبة تماماً ودون أي مقدمات أو هوامش إضافية خارج الصيغة الهيكلية المحددة.`,
                },
              ],
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.1,
              },
            });

            if (result && result.text) {
              return result;
            }
          } catch (err: any) {
            lastError = err;
            console.error(`Error with model ${model} on attempt ${attempt}:`, err);
            
            // Check for structural errors like 404 (model not found) to skip immediately
            if (err.status === 404 || (err.message && err.message.includes("not found"))) {
              break; 
            }

            // Exponential backoff
            if (attempt < attempts) {
              const waitTime = delayMs * attempt;
              console.log(`Temporary failure (could be 503/429), retrying in ${waitTime}ms...`);
              await delay(waitTime);
            }
          }
        }
      }

      throw lastError || new Error("فشلت جميع محاولات الاتصال بالخادم الذكي بسبب ضغط العمل الحالي.");
    };

    const response = await executeEvaluationWithFallbackAndRetry();
    const reportText = response.text || "";

    return res.json({
      success: true,
      report: reportText,
    });
  } catch (error: any) {
    console.error("Evaluation Error:", error);
    return res.status(500).json({
      error: error.message || "حدث خطأ غير متوقع أثناء معالجة وتقييم التلاوة.",
    });
  }
});

// Vite & Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all non-API, non-static routes (SPA fallback)
    app.get("*", (req, res) => {
      // Only serve index.html for non-API routes
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      } else {
        res.status(404).json({ error: "API endpoint not found" });
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
