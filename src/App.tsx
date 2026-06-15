import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Volume2,
  Trash2,
  Share2,
  Copy,
  BookOpen,
  User,
  Activity,
  Award,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Info
} from "lucide-react";
import { QURAN_SURAHS, Surah } from "./data/quran";

interface TajweedError {
  verseNum: string;
  word: string;
  errorType: string;
  correction: string;
}

interface ParsedReport {
  studentName: string;
  surahName: string;
  verses: string;
  accuracy: number;
  errors: TajweedError[];
  generalComment: string;
}

export default function App() {
  // Input fields
  const [studentName, setStudentName] = useState("عمر خالد الأحمد");
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1); // Default Al-Fatihah
  const [customSurah, setCustomSurah] = useState("");
  const [useCustomSurah, setUseCustomSurah] = useState(false);
  const [versesRange, setVersesRange] = useState("1-7");

  // Mobile App Simulation States
  const [viewMode, setViewMode] = useState<"responsive" | "simulator">("responsive");
  const [mobileTab, setMobileTab] = useState<"record" | "report" | "pwa">("record");
  const [simDevice, setSimDevice] = useState<"iphone" | "android">("iphone");

  // Audio setup
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/webm");

  // App UI states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [rawReport, setRawReport] = useState<string>("");
  const [parsedReport, setParsedReport] = useState<ParsedReport | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Parent configuration
  const [parentPhone, setParentPhone] = useState("");

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const activeSurahObj = QURAN_SURAHS.find((s) => s.id === selectedSurahId);

  // Auto-fill verses count when Surah changes
  useEffect(() => {
    if (activeSurahObj && !useCustomSurah) {
      setVersesRange(`1-${activeSurahObj.totalVerses}`);
    }
  }, [selectedSurahId, useCustomSurah]);

  // Audio recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Format timer
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      setAudioUrl(null);
      setAudioBlob(null);
      setUploadedFileName(null);
      audioChunksRef.current = [];
      setRecordingSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Select best audio format supported
      let options = { mimeType: "audio/webm" };
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        options = { mimeType: "audio/ogg;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/aac")) {
        options = { mimeType: "audio/aac" };
      } else {
        options = { mimeType: "" }; // Browser default
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      setAudioMimeType(recorder.mimeType || "audio/webm");

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const collectedBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        setAudioBlob(collectedBlob);
        const url = URL.createObjectURL(collectedBlob);
        setAudioUrl(url);
        
        // Stop all micro tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // Get chunks every 250ms
      setIsRecording(true);
      setEvaluationError(null);
    } catch (err: any) {
      console.error("Microphone Access Blocked:", err);
      setEvaluationError(
        "لا يمكن الوصول إلى الميكروفون. يرجى تفعيل إذن الميكروفون في المتصفح أو تحميل ملف صوتي بدلاً من ذلك."
      );
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setEvaluationError("نرجو تحميل ملفات صوتية فقط (WAV, MP3, M4A, WEBM, OGG).");
      return;
    }

    setAudioUrl(null);
    setAudioBlob(null);
    setUploadedFileName(file.name);
    setAudioMimeType(file.type);
    setEvaluationError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
    };
    reader.readAsArrayBuffer(file);
  };

  // Convert File/Blob to Base64 String
  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Clean raw AI response and parse it
  const parseAIReport = (text: string): ParsedReport => {
    // Default parsing elements
    let name = studentName;
    let surah = useCustomSurah ? customSurah : (activeSurahObj?.name || "");
    let verses = versesRange;
    let accuracy = 90;
    const errors: TajweedError[] = [];
    let generalComment = "";

    try {
      // 1. Extract Student Name
      const nameMatch = text.match(/الطالب:\s*([^\n\r]+)/);
      if (nameMatch) name = nameMatch[1].trim();

      // 2. Extract Surah Name
      const surahMatch = text.match(/السورة:\s*([^\n\r]+)/);
      if (surahMatch) surah = surahMatch[1].trim();

      // 3. Extract Verses
      const versesMatch = text.match(/الآيات:\s*([^\n\r]+)/);
      if (versesMatch) verses = versesMatch[1].trim();

      // 4. Extract Accuracy Percentage
      const accMatch = text.match(/نسبة الصحة:\s*(\d+)/);
      if (accMatch) {
        accuracy = parseInt(accMatch[1], 10);
      }

      // 5. Extract Errors
      // Match formulas like: - الآية 2: كلمة "وَلَيَالٍ" -> الخطأ: إظهار خاطئ -> الصحيح: تحقيق تنوين الكسر
      // or variations of bullets:
      const lines = text.split("\n");
      let inErrorsSection = false;

      for (let line of lines) {
        if (line.includes("تفصيل الأخطاء") || line.includes("التفصيل")) {
          inErrorsSection = true;
          continue;
        }
        if (line.includes("التعليق العام") || line.includes("تعليق عام")) {
          inErrorsSection = false;
        }

        if (inErrorsSection) {
          // Parse lines like: - الآية 2: كلمة "وَلَيَالٍ" -> الخطأ: إظهار خاطئ -> الصحيح: تحقيق تنوين الكسر
          const versePattern = /(?:الآية|آية)\s*(\d+(?:-\d+)?)/i;
          const wordPattern = /(?:كلمة|الكلمة)\s*["«'']([^"»'']+)["»'']/i;
          const errorPattern = /(?:الخطأ|خطأ):\s*([^->\n\r]+)/i;
          const correctionPattern = /(?:الصحيح|صحيح|الصح):\s*([^\n\r]+)/i;

          const hasVerse = line.match(versePattern);
          if (hasVerse) {
            const verseNum = hasVerse[1];
            const wordMatch = line.match(wordPattern);
            const word = wordMatch ? wordMatch[1] : "---";

            // Extract error message specifically splits by ->
            let errorType = "حكم تجويدي غير منضبط";
            let correction = "يرجى الاستماع والتصحيح";

            const arrowParts = line.split("->");
            if (arrowParts.length >= 2) {
              const part2 = arrowParts[1].replace(/الخطأ\s*:?/g, "").trim();
              errorType = part2;
            }
            if (arrowParts.length >= 3) {
              const part3 = arrowParts[2].replace(/الصحيح\s*:?/g, "").trim();
              correction = part3;
            } else {
              // try regex
              const errM = line.match(errorPattern);
              if (errM) errorType = errM[1].trim();
              const corM = line.match(correctionPattern);
              if (corM) correction = corM[1].trim();
            }

            errors.push({
              verseNum,
              word,
              errorType,
              correction
            });
          }
        }
      }

      // 6. Extract General Comment
      const commentMatch = text.match(/التعليق العام:\s*([\s\S]+)$/i);
      if (commentMatch) {
        generalComment = commentMatch[1].trim();
      } else {
        // Find line containing "التعليق العام"
        const commentLine = lines.find((l) => l.includes("التعليق العام") || l.includes("نصيحة"));
        if (commentLine) {
          generalComment = commentLine.replace(/التعليق العام\s*:?/g, "").trim();
        } else {
          generalComment = "تم تقييم التلاوة وإصدار التقرير بنجاح. استمر في المراجعة والترتيل.";
        }
      }
    } catch (e) {
      console.error("Error parsing report:", e);
    }

    return {
      studentName: name,
      surahName: surah,
      verses,
      accuracy,
      errors,
      generalComment
    };
  }

  // Set default placeholder data to view layout
  const loadMockReport = () => {
    const mockRaw = `【التقرير】
الطالب: عمر خالد الأحمد
السورة: سورة الفجر
الآيات: 1 - 10
نسبة الصحة: 88%

تفصيل الأخطاء:
- الآية 2: كلمة "وَلَيَالٍ" -> الخطأ: إظهار خاطئ -> الصحيح: تحقيق تنوين الكسر مع مراعاة الترقيق
- الآية 6: كلمة "بِالْمِعَادِ" -> الخطأ: قلقلة ناقصة -> الصحيح: توضيح قلقلة الدال عند الوقف
- الآية 9: كلمة "جَابُوا" -> الخطأ: مد زائد في الواو -> الصحيح: حركتان فقط دون زيادة أو تمطيط
- الآية 10: كلمة "الْأَوْتَادِ" -> الخطأ: تفخيم المرقق -> الصحيح: ترقيق الهمزة والواو قبل التاء

التعليق العام: "أداء طيب يا عمر، لديك مخارج حروف قوية ولكن تحتاج للتركيز أكثر على قواعد الترقيق والتفخيم، خاصة عند توالي الحروف المختلفة في الحكم. استمر في التدريب على سورة الفجر."`;
    
    setRawReport(mockRaw);
    setParsedReport(parseAIReport(mockRaw));
  };

  // Submit audio and form parameters for Evaluation
  const submitForEvaluation = async () => {
    if (!audioBlob) {
      setEvaluationError("نرجو تقديم تسجيل صوتي أو تحميل ملف صوتي أولاً.");
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);
    setRawReport("");
    setParsedReport(null);

    const surahText = useCustomSurah ? customSurah : (activeSurahObj?.name || "");

    try {
      const base64Audio = await convertBlobToBase64(audioBlob);

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          surahName: surahText,
          verses: versesRange,
          audioBase64: base64Audio,
          mimeType: audioMimeType
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشل تقييم التلاوة من قبل النظام الذكي.");
      }

      setRawReport(data.report);
      // Parse the report structured payload
      const parsed = parseAIReport(data.report);
      setParsedReport(parsed);

    } catch (err: any) {
      console.error("Evaluation error:", err);
      setEvaluationError(err.message || "حدث عطل غير متوقع أثناء الاتصال بخادم التقييم. نرجو المحاولة مجدداً.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Copy report to clipboard
  const copyReportToClipboard = () => {
    if (!rawReport) return;
    navigator.clipboard.writeText(rawReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy parents message text
  const copyShareMessage = () => {
    const parentMsg = getParentMessage();
    navigator.clipboard.writeText(parentMsg);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Generate Parents Report body
  const getParentMessage = () => {
    if (!rawReport) return "";
    return `السلام عليكم ورحمة الله وبركاته،\nإليكم تقرير تقييم تلاوة الطالب المرسل من منصة تصحيح التلاوة والتجويد الذكية:\n\n${rawReport}`;
  };

  // Get WhatsApp share link
  const getWhatsAppLink = () => {
    const textMsg = encodeURIComponent(getParentMessage());
    const phoneClean = parentPhone.replace(/[+\s-]/g, "");
    return `https://wa.me/${phoneClean ? phoneClean : ""}?text=${textMsg}`;
  };

  // Trigger Local audio playback
  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current) return;
    if (audioPlaying) {
      audioPlayerRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setAudioPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans md:border-8 border-2 border-[#2D5A27] transition-all duration-300" id="main-container">
      
      {/* Top Banner indicating mobile capabilities */}
      <div className="bg-[#1A3317] text-white px-4 py-2 text-center text-xs font-bold leading-relaxed flex flex-col md:flex-row items-center justify-center gap-2 border-b border-[#2D5A27]/20" id="mobile-banner">
        <span className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse shrink-0" />
          <span>تطبيق ويب ذكي متطور (PWA) قابل للتثبيت كلياً كـ تطبيق جوال مستقل ومباشر!</span>
        </span>
        <div className="flex gap-2 mt-1 md:mt-0">
          <button
            onClick={() => { setViewMode(viewMode === "responsive" ? "simulator" : "responsive"); }}
            className="bg-[#D4AF37] hover:bg-[#bfa032] text-black text-[10px] px-2.5 py-1 rounded-xs font-black transition-all flex items-center gap-1 active:scale-95"
          >
            {viewMode === "responsive" ? "📱 محاكاة كأنه تطبيق موبايل" : "💻 العودة لتصفح الكمبيوتر العريض"}
          </button>
        </div>
      </div>

      {/* Top Header bar with geometric styling */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-[#2D5A27]/20 pb-5 mb-5 px-4 md:px-6 pt-5 gap-3" id="app-header">
        <div className="flex flex-col text-center md:text-right">
          <div className="flex items-center justify-center md:justify-start gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#2D5A27] animate-pulse"></span>
            <span className="text-[#2D5A27] font-bold text-xs tracking-wider uppercase">نظام تقييم التلاوات الاحترافي للجوال</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1A3317] tracking-tight font-sans">منصة تصحيح التلاوة والتجويد</h1>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* View Mode Indicator Badge */}
          <div className="bg-[#FAF7F0] border border-[#2D5A27]/20 text-[#2D5A27] px-3 py-1.5 text-xs font-bold rounded-sm flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>{viewMode === "responsive" ? "الوضع المتجاوب" : "وضع تطبيق الجوال"}</span>
          </div>

          <button 
            type="button"
            onClick={loadMockReport}
            className="text-[#2D5A27] border border-[#2D5A27]/30 hover:border-[#2D5A27] hover:bg-[#2D5A27]/5 px-3 py-1.5 text-xs font-bold rounded-sm flex items-center gap-1 transition-all active:scale-95 bg-white shadow-sm"
            title="تحميل عينة توضيحية للتقرير"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            تحميل تقرير تجريبي
          </button>
        </div>
      </header>

      {/* Main app contents */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-2 md:px-6 pb-6" id="app-workspace">
        {viewMode === "simulator" ? (
          /* =====================================================================
             interactive active phone mockup mode (perfect for showing mobile compatibility)
             ===================================================================== */
          <div className="flex flex-col items-center justify-center py-4" id="mobile-simulator-layout">
            <div className="mb-4 flex gap-4 text-xs font-bold">
              <span className="text-gray-500">اختر نوع الهاتف للمحاكاة:</span>
              <button 
                onClick={() => setSimDevice("iphone")} 
                className={`pb-1 border-b-2 transition ${simDevice === "iphone" ? "border-[#2D5A27] text-[#2D5A27]" : "border-transparent text-gray-400"}`}
              >
                آيفون (iOS)
              </button>
              <button 
                onClick={() => setSimDevice("android")} 
                className={`pb-1 border-b-2 transition ${simDevice === "android" ? "border-[#2D5A27] text-[#2D5A27]" : "border-transparent text-gray-400"}`}
              >
                أندرويد (Android)
              </button>
            </div>

            {/* Simulated Phone Frame Container */}
            <div className={`relative bg-[#1A3317] p-3 shadow-2xl transition-all duration-500 w-[375px] h-[780px] max-w-full ${
              simDevice === "iphone" 
                ? "rounded-[50px] border-4 border-gray-800 ring-12 ring-gray-700 ring-opacity-50" 
                : "rounded-[32px] border-4 border-gray-900 border-opacity-90"
            }`}>
              
              {/* iPhone Notch or Camera Hole */}
              {simDevice === "iphone" ? (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-40 bg-gray-800 rounded-b-2xl z-30 flex items-center justify-center">
                  <div className="w-12 h-1 bg-gray-900 rounded-full mb-1"></div>
                  <div className="w-2.5 h-2.5 bg-gray-950 rounded-full ml-3 border border-gray-800"></div>
                </div>
              ) : (
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-950 rounded-full z-30 border border-gray-800"></div>
              )}

              {/* Side Volume / Power representation pills */}
              <div className="absolute -left-1.5 top-28 w-1 h-12 bg-gray-800 rounded-r-sm"></div>
              <div className="absolute -left-1.5 top-44 w-1 h-12 bg-gray-800 rounded-r-sm"></div>
              <div className="absolute -right-1.5 top-36 w-1 h-16 bg-gray-800 rounded-l-sm"></div>

              {/* Interactive Phone Content Screen Area */}
              <div className="w-full h-full bg-[#FAF9F5] rounded-[38px] overflow-hidden flex flex-col relative" dir="rtl">
                
                {/* Mock OS Status Bar */}
                <div className="h-10 bg-[#2D5A27] text-white flex justify-between items-center px-6 pt-2 text-[10px] font-bold select-none z-20 shrink-0">
                  <span>09:53 ص</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px]">مصحح التلاوة</span>
                    <span>📶</span>
                    <span>🔋 96%</span>
                  </div>
                </div>

                {/* Simulated Header block inside app */}
                <div className="bg-[#2D5A27] text-white py-3 px-4 shadow-sm flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center font-sans font-black text-xs text-[#D4AF37]">
                      ت
                    </div>
                    <div>
                      <h4 className="text-xs font-black leading-none">مُصحِّح التلاوة الذكي</h4>
                      <span className="text-[9px] text-[#FAF9F5]/85">مساعد التجويد الشخصي للمحفظين</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-[#D4AF37] font-bold">
                    نشط دائمًا 🟢
                  </span>
                </div>

                {/* Interactive Inner Area with scrolling and tab rendering */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col pb-16 scrollbar-none" id="simulator-interactive-area">
                  {mobileTab === "record" && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      {renderMobileSetupForm()}
                    </div>
                  )}

                  {mobileTab === "report" && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      {parsedReport ? (
                        renderMobileReportView()
                      ) : (
                        <div className="bg-white border border-[#E5E1D8] p-6 text-center rounded-xl flex flex-col items-center justify-center min-h-[350px]">
                          <div className="w-14 h-14 bg-[#F2EDE4] rounded-full flex items-center justify-center text-[#2D5A27] mb-4">
                            <BookOpen className="w-7 h-7" />
                          </div>
                          <h4 className="font-bold text-base text-[#1A3317] mb-1">بانتظار قراءة التلميذ</h4>
                          <p className="text-gray-500 text-xs leading-relaxed max-w-xs mb-4">
                            قم بضبط الاسم والسورة في تبويب "لوحة التلاوة 🎤" وسجّل الصوت، ثم انقر لإنتاج التقرير هنا فوراً.
                          </p>
                          <button
                            onClick={() => setMobileTab("record")}
                            className="text-xs text-white bg-[#2D5A27] font-bold px-4 py-2 rounded-lg"
                          >
                            البدء واختيار السورة
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {mobileTab === "pwa" && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      {renderPwaInstructions()}
                    </div>
                  )}
                </div>

                {/* Sticky Mobile Application Navigation Bar (Sleek Apple iOS/Android tabs) */}
                <nav className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-100 flex justify-around items-center z-20 px-2 shadow-lg">
                  <button 
                    onClick={() => setMobileTab("record")}
                    className={`flex flex-col items-center justify-center flex-1 py-1 transition ${mobileTab === "record" ? "text-[#2D5A27] font-black" : "text-gray-400"}`}
                  >
                    <Mic className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px]">لوحة التلاوة</span>
                  </button>
                  <button 
                    onClick={() => setMobileTab("report")}
                    className={`flex flex-col items-center justify-center flex-1 py-1 relative transition ${mobileTab === "report" ? "text-[#2D5A27] font-black" : "text-gray-400"}`}
                  >
                    {parsedReport && (
                      <span className="absolute top-1.5 right-1/2 translate-x-5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    )}
                    <FileText className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px]">التقرير الكامل</span>
                  </button>
                  <button 
                    onClick={() => setMobileTab("pwa")}
                    className={`flex flex-col items-center justify-center flex-1 py-1 transition ${mobileTab === "pwa" ? "text-[#2D5A27] font-black" : "text-gray-400"}`}
                  >
                    <Share2 className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px]">تثبيت كـ تطبيق</span>
                  </button>
                </nav>

                {/* iPhone Home bottom line indicator */}
                {simDevice === "iphone" && (
                  <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-400 rounded-full z-30 select-none"></div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
             highly optimized responsive mode (shows side-by-side on desktop, TABS ON MOBILE)
             ===================================================================== */
          <div className="flex flex-col gap-6" id="responsive-viewapp-layout">
            
            {/* Tablet & Mobile native top bar toggler to avoid infinite scrolling */}
            <div className="lg:hidden flex bg-[#FAF7F0] border border-[#2D5A27]/20 p-1 rounded-sm gap-1 mb-2 font-bold text-sm" id="mobile-tabs-controller">
              <button
                type="button"
                onClick={() => setMobileTab("record")}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition ${
                  mobileTab === "record" ? "bg-[#2D5A27] text-white shadow-sm" : "text-[#4B5563] hover:bg-[#F2EDE4]"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>التلاوة والتسجيل</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("report")}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 relative transition ${
                  mobileTab === "report" ? "bg-[#2D5A27] text-white shadow-sm" : "text-[#4B5563] hover:bg-[#F2EDE4]"
                }`}
              >
                {parsedReport && (
                  <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
                <FileText className="w-4 h-4" />
                <span>التقرير والنتائج</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("pwa")}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition ${
                  mobileTab === "pwa" ? "bg-[#2D5A27] text-white shadow-sm" : "text-[#4B5563] hover:bg-[#F2EDE4]"
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>تثبيت كـ تطبيق</span>
              </button>
            </div>

            {/* Desktop structure utilizing full width columns, but hiding on mobile depending on active tab */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="app-grid-dual">
              
              {/* Setup form left block */}
              <div className={`lg:col-span-5 flex flex-col gap-6 ${mobileTab !== "record" ? "hidden lg:flex" : "flex"}`} id="desktop-setup">
                {renderMobileSetupForm()}
              </div>

              {/* Evaluation Results right block */}
              <div className={`lg:col-span-7 flex flex-col gap-6 ${mobileTab === "record" ? "hidden lg:flex" : mobileTab === "pwa" ? "hidden" : "flex"}`} id="desktop-report">
                {parsedReport ? (
                  renderMobileReportView()
                ) : (
                  !isEvaluating && (
                    <div className="bg-white border border-[#E5E1D8] p-12 text-center rounded-sm flex flex-col items-center justify-center min-h-[460px]">
                      <div className="w-16 h-16 bg-[#F2EDE4] rounded-full flex items-center justify-center text-[#2D5A27] mb-6 border-2 border-[#D4AF37]/50">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-extrabold text-[#1A3317] mb-2">بانتظار تلاوة الطالب</h3>
                      <p className="text-[#6B7280] text-xs max-w-sm leading-relaxed mb-6">
                        سجل تلاوة الطالب أو ارفع ملف التلاوة الصوتي، ثم اضغط على زر التقييم ليقوم الذكاء الاصطناعي بمطابقة التلاوة واستخراج المخارج وتوضيح تصحيح دقيق لأحكام التجويد فورا.
                      </p>
                      
                      <div className="bg-[#FAF7F0] border border-[#E5E1D8] p-4 rounded-xs text-right max-w-md">
                        <h4 className="text-[11px] font-bold text-[#2D5A27] mb-2 uppercase flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          ملاحظات فنية وتجويدية مهيأة في المنصة:
                        </h4>
                        <ul className="text-[11px] text-[#4B5563] space-y-1 list-disc list-inside">
                          <li>المنصة تتعرف تلقائيًا على أحكام النون الساكنة والتنوين وقواعد المد.</li>
                          <li>تساعد في حساب نسبة دقة مخارج الحروف وقراءات الوقف.</li>
                          <li>يمكنك الضغط على زر <span className="font-bold text-[#2D5A27]">تحميل تقرير تجريبي</span> لمعاينة الهيكلة مسبقا.</li>
                        </ul>
                      </div>
                    </div>
                  )
                )}

                {isEvaluating && (
                  <div className="bg-white border border-[#E5E1D8] p-12 text-center rounded-sm flex flex-col items-center justify-center min-h-[460px]">
                    <div className="relative mb-6">
                      <div className="w-14 h-14 rounded-full border-4 border-[#2D5A27]/20 border-t-[#2D5A27] animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Mic className="w-5 h-5 text-[#2D5A27] animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-[#1A3317] mb-2">جاري تحليل موجات الصوت ومقاطعتها بالتجويد...</h3>
                    <p className="text-[#6B7280] text-xs max-w-xs mx-auto leading-relaxed">
                      يقوم محرك التقييم الذكي التجويدي حاليًا بالاستماع إلى الكلمات لتمييز الغنن، المدود، ومخارج الحروف بدقة متناهية. نرجو عدم إغلاق هذه الصفحة.
                    </p>
                  </div>
                )}
              </div>

              {/* Install PWA Guide (Hidden unless in PWA tab on mobile) */}
              <div className={`col-span-12 ${mobileTab !== "pwa" ? "hidden" : "lg:hidden flex flex-col"}`} id="responsive-pwa">
                {renderPwaInstructions()}
              </div>

            </div>

          </div>
        )}
      </div>

      {/* App Footer */}
      <footer className="mt-auto border-t border-[#2D5A27]/20 px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center bg-[#FAF7F0] gap-3 text-center md:text-right" id="app-footer">
        <span className="text-xs text-[#9CA3AF]">
          جميع الحقوق البرمجية محفوظة لمنصة تصحيح تلاوة القرآن الكريم بالذكاء الاصطناعي © ٢٠٢٦
        </span>
        <div className="flex items-center text-[#9CA3AF] text-[10px] gap-4 font-mono">
          <span>الجلسة: #APP-2026</span>
          <span>المدة: {formatTime(recordingSeconds)}</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-[#2D5A27] rounded-full"></span>
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
          </div>
        </div>
      </footer>
    </div>
  );

  /* =========================================================================
     Sub-render helper functions to guarantee flawless rendering
     ========================================================================= */

  function renderMobileSetupForm() {
    return (
      <div className="flex flex-col gap-4">
        {/* Card 1: Student info */}
        <section className="bg-white border border-[#E5E1D8] p-4 md:p-5 shadow-xs rounded-lg flex flex-col gap-3.5">
          <h3 className="text-base font-extrabold text-[#1A3317] border-b border-[#F2EDE4] pb-2 flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#2D5A27]" />
            بيانات الطالب والتلاوة
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#4B5563]" htmlFor="student-name-input">اسم الطالب الكامل:</label>
            <input
              id="student-name-input"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#E5E1D8] px-3 py-2 rounded-md text-sm text-[#1A3317] font-semibold focus:outline-none focus:border-[#2D5A27] transition-all"
              placeholder="عمر خالد"
            />
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#4B5563]" htmlFor="surah-select">السورة الكريمة:</label>
              {!useCustomSurah ? (
                <select
                  id="surah-select"
                  value={selectedSurahId}
                  onChange={(e) => {
                    setSelectedSurahId(Number(e.target.value));
                    setUseCustomSurah(false);
                  }}
                  className="w-full bg-[#FAF9F5] border border-[#E5E1D8] px-3 py-2 rounded-md text-xs text-[#1A3317] font-bold focus:outline-none"
                >
                  {QURAN_SURAHS.map((surah) => (
                    <option key={surah.id} value={surah.id}>
                      {surah.name} ({surah.englishName})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customSurah}
                  onChange={(e) => setCustomSurah(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E5E1D8] px-3 py-2 rounded-md text-xs text-[#1A3317] font-semibold"
                  placeholder="اكتب اسم السورة"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setUseCustomSurah(!useCustomSurah);
                  if (!useCustomSurah) setCustomSurah("");
                }}
                className="text-right text-[10px] text-[#2D5A27] font-bold hover:underline mt-0.5"
              >
                {useCustomSurah ? "العودة للقائمة المعتمدة" : "سورة غير موجودة بالقائمة؟"}
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#4B5563]" htmlFor="verses-input">الآيات المطلوبة للتقييم:</label>
              <input
                id="verses-input"
                type="text"
                value={versesRange}
                onChange={(e) => setVersesRange(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E5E1D8] px-3 py-2 rounded-md text-xs text-[#1A3317] font-bold text-center"
                placeholder="1-7"
              />
              <span className="text-[9px] text-[#9CA3AF] text-center">
                {!useCustomSurah && activeSurahObj ? `عدد آيات السورة: ${activeSurahObj.totalVerses} آية` : ""}
              </span>
            </div>
          </div>

          {!useCustomSurah && activeSurahObj && activeSurahObj.versesText && (
            <div className="bg-[#FAF7F0] border border-[#E5E1D8] p-3 rounded-md flex flex-col gap-1.5 mt-1">
              <p className="text-[10px] font-bold text-[#2D5A27] flex items-center gap-1 uppercase">
                <BookOpen className="w-3 h-3" />
                القراءة المباشرة من الشاشة:
              </p>
              <div 
                className="max-h-36 overflow-y-auto text-center px-1.5 py-2 bg-white/85 rounded-xs border border-[#F2EDE4] scrollbar-none font-quran text-base text-[#1A3317] leading-loose"
                dir="rtl"
              >
                {activeSurahObj.versesText.map((v, i) => (
                  <span key={i} className="inline-block mx-0.5">
                    {v} <span className="text-[9px] text-[#D4AF37] align-middle font-sans font-bold">﴿{i + 1}﴾</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Card 2: Audio Recording UI */}
        <section className="bg-white border border-[#E5E1D8] p-4 md:p-5 shadow-xs rounded-lg flex flex-col gap-3.5 text-center">
          <h3 className="text-base font-extrabold text-[#1A3317] text-right border-b border-[#F2EDE4] pb-2 flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-[#2D5A27]" />
            تسجيل صوت الطالب
          </h3>

          <div className="py-2.5 flex flex-col items-center justify-center gap-3 border border-[#F2EDE4] bg-[#FAF9F5] rounded-lg p-3 relative">
            {isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <div 
                  onClick={stopRecording}
                  className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md animate-pulse active:scale-95 transition"
                  title="اضغط لإيقاف التسجيل الصوتي والاحتفاظ به"
                >
                  <Square className="w-5 h-5 fill-white" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                  <span className="text-red-600 font-extrabold font-mono text-base">
                    {formatTime(recordingSeconds)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-semibold">جاري تسجيل تلاوة الطالب الآن...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-12 h-12 bg-[#2D5A27] text-white rounded-full flex items-center justify-center hover:bg-[#1A3317] shadow-sm transition transform active:scale-95"
                  title="بدء التسجيل بالميكرفون"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <p className="text-xs font-bold text-[#1A3317]">اضغط على الميكروفون لبدء التسجيل</p>
                <span className="text-[10px] text-gray-400">تحدث بنطق واضح لترتيل الطالب</span>
              </div>
            )}

            <div className="w-full border-t border-[#F2EDE4] pt-2.5 mt-1">
              <label className="cursor-pointer bg-[#F2EDE4] hover:bg-[#E5E1D8] text-[#1A3317] font-bold px-2.5 py-1 text-[10px] rounded-sm transition">
                أو اختر ملف صوتي محفوظ
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {uploadedFileName && (
                <p className="text-[9px] text-[#2D5A27] font-bold mt-1 max-w-full truncate">
                  مرفوع: {uploadedFileName}
                </p>
              )}
            </div>
          </div>

          {audioUrl && (
            <div className="bg-[#FAF7F0] border border-[#D4AF37]/30 p-2 rounded-md flex items-center justify-between">
              <button
                type="button"
                onClick={toggleAudioPlayback}
                className="p-1.5 bg-white border border-[#E5E1D8] rounded-full text-[#2D5A27] active:scale-90"
              >
                {audioPlaying ? <Square className="w-3 h-3 fill-[#2D5A27]" /> : <Play className="w-3 h-3 fill-[#2D5A27]" />}
              </button>
              <div className="text-right flex-1 px-2.5">
                <p className="text-[10px] font-bold text-[#1A3317]">التسجيل جاهز للتقييم</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAudioUrl(null);
                  setAudioBlob(null);
                  setUploadedFileName(null);
                }}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {evaluationError && (
            <p className="text-[10px] text-red-700 bg-red-50 p-2 rounded text-right">{evaluationError}</p>
          )}

          <button
            type="button"
            onClick={submitForEvaluation}
            disabled={isEvaluating || !audioBlob}
            className={`w-full font-bold text-xs text-white py-3 px-4 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              !audioBlob
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#2D5A27] hover:bg-[#1A3317] active:scale-[0.98]"
            }`}
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري المعالجة والتحليل...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                بدء تقييم التلاوة بالذكاء الاصطناعي
              </>
            )}
          </button>
        </section>
      </div>
    );
  }

  function renderMobileReportView() {
    if (!parsedReport) return null;
    return (
      <article className="flex flex-col bg-white border border-[#E5E1D8] shadow-xs rounded-lg overflow-hidden" id="report-mobile-block">
        
        {/* Score and summary info */}
        <div className="bg-[#FAF9F5] p-3.5 border-b border-[#E5E1D8] flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 bg-[#2D5A27] text-[#D4AF37] rounded-full flex items-center justify-center font-bold text-lg border border-[#D4AF37]">
            {parsedReport.accuracy}%
          </div>
          <div>
            <h4 className="text-sm font-black text-[#1A3317]">{parsedReport.studentName}</h4>
            <p className="text-[10px] text-gray-500 font-bold">{parsedReport.surahName} • الآيات: {parsedReport.verses}</p>
          </div>
        </div>

        {/* Errors details scroll list */}
        <div className="p-3.5 flex flex-col gap-3.5">
          <div className="flex justify-between items-center">
            <h5 className="font-bold text-xs text-[#1A3317] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#2D5A27]" />
              أحكام التجويد المراد تصحيحها:
            </h5>
            <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">
              {parsedReport.errors.length} تنبيهات
            </span>
          </div>

          {parsedReport.errors.length === 0 ? (
            <div className="bg-green-50 border border-green-100 p-4 text-center rounded">
              <CheckCircle className="w-8 h-8 text-[#2D5A27] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#1A3317]">تلاوة نموذجية خالية من الأخطاء!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-thin">
              {parsedReport.errors.map((err, index) => (
                <div key={index} className="bg-[#FAF7F0] border border-[#E5E1D8] p-2.5 rounded flex flex-col gap-1 text-right">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#2D5A27]">الآية {err.verseNum}</span>
                    <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold">{err.errorType}</span>
                  </div>
                  <p className="text-xs font-bold text-black font-quran">الكلمة المخطوءة: "{err.word}"</p>
                  <p className="text-[10px] text-[#4B5563] bg-white p-1.5 rounded border border-gray-100">💡 النطق الصحيح: {err.correction}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comment advisory block */}
          <div className="bg-[#FAF7F0] border-r-3 border-[#2D5A27] p-3 rounded-l text-xs">
            <span className="text-[9px] font-bold text-gray-400 block mb-0.5">نصيحة وتوجيه المعلم الذكي:</span>
            <p className="text-[#1A3317] italic leading-relaxed">{parsedReport.generalComment}</p>
          </div>

          {/* Parents messaging area */}
          <div className="border border-dashed border-[#2D5A27]/20 p-3 rounded bg-white mt-1">
            <h5 className="font-bold text-xs text-[#1A3317] mb-2 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-[#2D5A27]" />
              مشاركة مع ولي الأمر سريعاً
            </h5>
            
            <div className="flex flex-col gap-2">
              <input
                type="text"
                className="bg-[#FAF9F5] border border-[#E5E1D8] px-2.5 py-1 text-xs font-mono rounded w-full"
                placeholder="رقم واتساب: 966500000000"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
              />
              <div className="flex gap-1.5">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#128C7E] hover:bg-[#075e54] text-white py-2 text-[10px] font-bold rounded text-center flex items-center justify-center gap-1 transition"
                >
                  واتساب
                </a>
                <button
                  onClick={copyShareMessage}
                  className="flex-1 bg-[#FAF9F5] border border-gray-300 text-gray-700 py-2 text-[10px] font-bold rounded"
                >
                  {copiedShare ? "تم النسخ!" : "نسخ الرسالة"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </article>
    );
  }

  function renderPwaInstructions() {
    return (
      <section className="bg-white border border-[#E5E1D8] p-5 shadow-xs rounded-lg text-right flex flex-col gap-4" id="pwa-guide-block">
        <div className="text-center pb-2 border-b border-gray-100">
          <div className="w-12 h-12 bg-[#FAF7F0] rounded-full mx-auto flex items-center justify-center text-[#2D5A27] mb-2 border border-[#D4AF37]/40">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-extrabold text-[#1A3317]">تثبيت منصة التلاوة كـ تطبيق مستقل</h3>
          <p className="text-[10px] text-gray-400 mt-1">وفر أسهل طريقة للوصول للمنصة على هاتفك واجهزه الطلاب دون الحاجة لفتح المتصفح!</p>
        </div>

        <div className="flex flex-col gap-3 text-xs text-[#4B5563]">
          <div className="bg-[#FAF7F0] p-3 rounded-lg border border-[#E5E1D8]">
            <h4 className="font-bold text-[#2D5A27] mb-1.5 flex items-center gap-1">
              <span>🍏</span> لمالكي هواتف آيفون (iPhone/iPad):
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
              <li>افتح هذا الرابط في متصفح <span className="font-bold text-black">Safari</span> الافتراضي.</li>
              <li>اضغط على زر المشاركة <span className="font-bold text-blue-600">Share (مربع مع سهم لأعلى)</span> بالأسفل.</li>
              <li>اختر <span className="font-bold text-black">"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</span>.</li>
              <li>اضغط <span className="font-bold text-[#2D5A27]">"إضافة"</span> لتجد التطبيق على شاشتك بأيقونة رائعة.</li>
            </ol>
          </div>

          <div className="bg-[#FAF7F0] p-3 rounded-lg border border-[#E5E1D8]">
            <h4 className="font-bold text-[#2D5A27] mb-1.5 flex items-center gap-1">
              <span>🤖</span> لمالكي هواتف أندرويد (Samsung, Huawei, Xiaomi...):
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
              <li>افتح الرابط في تطبيق <span className="font-bold text-black">Google Chrome</span>.</li>
              <li>اضغط على النقاط الثلاث <span className="font-bold text-black">(⋮)</span> في الزاوية العلوية للمتصفح.</li>
              <li>اضغط على <span className="font-bold text-emerald-700">"تثبيت التطبيق" (Install App)</span> أو "إضافة إلى الشاشة الرئيسية".</li>
              <li>سيتم تحميله وتثبيته فوراً كـ تطبيق جوال متكامل يدعم تصفح آمن وسريع بضغطة زر.</li>
            </ol>
          </div>
        </div>

        <div className="bg-[#2D5A27] text-white p-3 rounded-lg text-center text-xs">
          <p className="font-bold">✨ مميزات التثبيت للجوال:</p>
          <p className="text-[10px] text-white/90 mt-1">تصفح بملء الشاشة، سرعة فائقة في معالجة الملفات الصوتية، وحفظ تلقائي لجميع سجلات المعلم.</p>
        </div>
      </section>
    );
  }
}
