import React, { useState, useEffect, useRef } from "react";
import FlashcardGame from "./FlashcardGame.jsx";
import CalendarGame from "./CalendarGame.jsx";

// Assets
import nadaLogo from "./assets/nada.png";
import wkLogo from "./assets/wonderkids.png";
import mascotImg from "./assets/nadamascot.png";

const LANGS = ["en", "th"];

const TEXT = {
  title: { en: "Mental Arithmetic", th: "ระบบคำนวณจิต" },
  chooseGame: { en: "Select Game Mode", th: "เลือกโหมดเกม" },
  flashcard: { en: "Flashcard", th: "แฟลชการ์ด" },
  calendar: { en: "Nada Calendar", th: "ปฏิทินนดา" },
  language: { en: "Language / ภาษา", th: "Language / ภาษา" },
};

function App() {
  const [view, setView] = useState("home"); // home | flashcard | calendar
  const [lang, setLang] = useState(localStorage.getItem("wk-lang") || "en");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const flashRef = useRef(null);
  const calRef = useRef(null);

  const t = (k) => TEXT[k]?.[lang] ?? k;

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem("wk-lang", l);
  };

  // Fullscreen toggle logic
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const openSettings = () => {
    if (view === "flashcard" && flashRef.current?.openSettings) {
      flashRef.current.openSettings();
    }
    if (view === "calendar" && calRef.current?.openSettings) {
      calRef.current.openSettings();
    }
  };

  // Render the current view
  const renderContent = () => {
    if (view === "flashcard") return <FlashcardGame ref={flashRef} lang={lang} />;
    if (view === "calendar") return <CalendarGame ref={calRef} lang={lang} />;

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-12 animate-in fade-in zoom-in duration-500 z-10">
        <div className="text-center space-y-2">
          <h1 className="text-5xl sm:text-7xl font-black text-slate-800 tracking-tight drop-shadow-sm">
            {t("title")}
          </h1>
          <p className="text-xl sm:text-2xl text-slate-500 font-bold uppercase tracking-widest">
            {t("chooseGame")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 w-full max-w-3xl px-6">
          <button
            onClick={() => setView("flashcard")}
            className="flex-1 group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-cyan-400 to-blue-600 p-8 text-white shadow-[0_20px_50px_rgba(6,182,212,0.3)] hover:scale-105 hover:shadow-[0_30px_60px_rgba(6,182,212,0.5)] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-6xl mb-4 block group-hover:scale-110 transition-transform duration-300">🧠</span>
            <span className="text-3xl font-black uppercase tracking-wider">{t("flashcard")}</span>
          </button>

          <button
            onClick={() => setView("calendar")}
            className="flex-1 group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-400 to-rose-600 p-8 text-white shadow-[0_20px_50px_rgba(244,63,94,0.3)] hover:scale-105 hover:shadow-[0_30px_60px_rgba(244,63,94,0.5)] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-6xl mb-4 block group-hover:scale-110 transition-transform duration-300">📅</span>
            <span className="text-3xl font-black uppercase tracking-wider">{t("calendar")}</span>
          </button>
        </div>

        {/* Language Switcher */}
        <div className="flex flex-col items-center gap-3 mt-8">
          <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">{t("language")}</span>
          <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-slate-200">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={`
                  px-6 py-2 rounded-full font-bold text-sm transition-all
                  ${lang === l 
                    ? "bg-slate-800 text-white shadow-md" 
                    : "text-slate-500 hover:bg-slate-200/50"}
                `}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/30 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-200/30 rounded-full blur-[100px]" />
      </div>

      {/* --- ASSETS: LOGOS (Combined Left) --- */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-4">
        {/* Glow Background */}
        <div className="absolute inset-0 bg-white/60 blur-xl rounded-full scale-125 -z-10 pointer-events-none"></div>
        
        <img 
          src={nadaLogo} 
          alt="Nada Logo" 
          className="w-20 sm:w-28 drop-shadow-md transition-transform hover:scale-105"
        />
        <img 
          src={wkLogo} 
          alt="Wonder Kids Logo" 
          className="w-20 sm:w-28 drop-shadow-md transition-transform hover:scale-105"
        />
      </div>

      {/* --- ASSETS: MASCOT --- */}
      <div className="fixed bottom-0 left-2 sm:left-4 z-50 pointer-events-none">
        <img 
          src={mascotImg} 
          alt="Mascot" 
          className="w-24 sm:w-32 animate-mascot-float drop-shadow-xl"
        />
      </div>

      {/* Navigation & Controls (Right Side) */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 flex justify-end gap-4 pointer-events-none">
        {view !== "home" && (
          <div className="pointer-events-auto flex gap-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-slate-200/50">
            <button
              onClick={() => setView("home")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <button
              onClick={openSettings}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
               ⚙️
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              {isFullscreen ? "⤢" : "⛶"}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="relative w-full h-full flex flex-col">
        {renderContent()}
      </main>

      <style jsx global>{`
        @keyframes mascotFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-mascot-float {
          animation: mascotFloat 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default App;