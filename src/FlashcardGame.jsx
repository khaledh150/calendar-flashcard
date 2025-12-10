import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

// Import Audio Assets
import tickSound from "./assets/tick.wav";
import dingSound from "./assets/ding.wav";
import getReadySound from "./assets/getready321.wav";
import buzzSound from "./assets/startbuzz.wav";

const TEXT = {
  speed: { en: "Speed (seconds)", th: "ความเร็ว (วินาที)" },
  numset: { en: "Numbers per Set", th: "จำนวนตัวเลขต่อชุด" },
  rounds: { en: "Total Rounds", th: "จำนวนรอบทั้งหมด" },
  revealMode: { en: "Game Mode", th: "โหมดเกม" },
  modeEach: { en: "Practice (Answer after each)", th: "ฝึกซ้อม (เฉลยทีละข้อ)" },
  modeEnd: { en: "Competition (Reveal all at end)", th: "แข่งขัน (เฉลยท้ายเกม)" },
  start: { en: "START GAME", th: "เริ่มเกม" },
  nextSet: { en: "NEXT SET", th: "ชุดถัดไป" },
  nextRound: { en: "NEXT ROUND", th: "รอบถัดไป" },
  showAnswer: { en: "REVEAL ANSWER", th: "เฉลยคำตอบ" },
  finish: { en: "FINISH & REVEAL", th: "จบเกม & เฉลย" },
  getReady: { en: "GET READY", th: "เตรียมตัว" },
  summary: { en: "SCOREBOARD", th: "สรุปผลคะแนน" },
};

const t = (lang, key) => TEXT[key]?.[lang] ?? key;

/**
 * LOGIC: Generates random sets
 */
function generateRandomSets(numSets = 30, numbersPerSet = 9) {
  const sets = [];
  for (let i = 0; i < numSets; i++) {
    const set = [];
    let runningTotal = 0;

    for (let j = 0; j < numbersPerSet; j++) {
      let num;
      // First number: 10-99
      if (j === 0) {
        num = Math.floor(Math.random() * 90) + 10;
        runningTotal += num;
        set.push(num);
        continue;
      }
      // Subsequent numbers
      const canSubtract = runningTotal > 20;
      if (Math.random() < 0.5 && canSubtract) {
        // Subtract
        const maxSub = Math.min(89, runningTotal - 1);
        num = -(Math.floor(Math.random() * (maxSub - 10 + 1)) + 10);
      } else {
        // Add
        num = Math.floor(Math.random() * 90) + 10;
      }

      runningTotal += num;
      // Fix if zero/negative
      if (runningTotal <= 0) {
        const fix = Math.floor(Math.random() * 40) + 60; 
        set.push(fix);
        runningTotal += fix;
        continue;
      }
      set.push(num);
    }
    sets.push(set);
  }
  return sets;
}

const FlashcardGame = forwardRef(function FlashcardGame({ lang }, ref) {
  // Settings
  const [speed, setSpeed] = useState(1.0);
  const [numbersPerSet, setNumbersPerSet] = useState(5);
  const [totalRounds, setTotalRounds] = useState(5);
  const [revealMode, setRevealMode] = useState("each"); // 'each' | 'end'

  // State
  const [phase, setPhase] = useState("settings"); // settings | getready | playing | waiting | answer | summary
  const [sets, setSets] = useState([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentNumberIndex, setCurrentNumberIndex] = useState(0);
  const [readyText, setReadyText] = useState("");
  const [answer, setAnswer] = useState(null);
  
  // Summary Animation State
  const [revealedSummaryCount, setRevealedSummaryCount] = useState(0);

  // Audio Refs
  const audioRefs = useRef({
    tick: new Audio(tickSound),
    ding: new Audio(dingSound),
    ready: new Audio(getReadySound),
    buzz: new Audio(buzzSound),
  });

  const intervalRef = useRef(null);
  const timeoutsRef = useRef([]);

  // Helper to play sounds safely
  const playSound = (name) => {
    try {
      const audio = audioRefs.current[name];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } catch (e) { console.error(e); }
  };

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Tick sound on number change
  useEffect(() => {
    if (phase === "playing") {
      playSound("tick");
    }
  }, [phase, currentNumberIndex]);

  // --- GAME FLOW ---

  const startSequenceForSet = (setIndex) => {
    clearTimers();
    setCurrentSetIndex(setIndex);
    setCurrentNumberIndex(0);
    setAnswer(null);
    setPhase("getready");
    
    // START GET READY SEQUENCE
    // 0.9s intervals: GET -> READY -> 3 -> 2 -> 1
    // Total 4.5s. Then Buzz. Then 1s pause. Then Start.
    
    playSound("ready");
    setReadyText("GET");

    const steps = [
      { t: 900, txt: "READY" },
      { t: 1800, txt: "3" },
      { t: 2700, txt: "2" },
      { t: 3600, txt: "1" },
      { t: 4500, txt: "" },  // Clear text, Play Buzz
      { t: 5500, txt: null } // Start Game (1s after buzz)
    ];

    steps.forEach(({ t, txt }) => {
      const id = setTimeout(() => {
        if (t === 4500) {
            playSound("buzz");
            setReadyText("");
        } else if (txt === null) {
            // START FLASHING
            setPhase("playing");
            intervalRef.current = setInterval(() => {
              setCurrentNumberIndex((prev) => {
                const next = prev + 1;
                // Check if we reached the end of the set
                if (next >= Math.max(1, Math.min(numbersPerSet, 20))) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                  setPhase("waiting");
                  return prev; // Stay on last index
                }
                return next;
              });
            }, Math.max(speed, 0.2) * 1000);
        } else {
            setReadyText(txt);
        }
      }, t);
      timeoutsRef.current.push(id);
    });
  };

  const handleStart = () => {
    const nps = Math.max(1, Math.min(numbersPerSet, 20));
    // Generate enough sets for the rounds selected
    const generated = generateRandomSets(Math.max(30, totalRounds), nps);
    setSets(generated);
    startSequenceForSet(0);
  };

  // Logic for "Reveal Answer" button (Practice Mode)
  const handleShowAnswer = () => {
    if (!sets[currentSetIndex]) return;
    playSound("ding");
    const nps = Math.max(1, Math.min(numbersPerSet, 20));
    const slice = sets[currentSetIndex].slice(0, nps);
    const res = slice.reduce((a, b) => a + b, 0);
    setAnswer(res);
    setPhase("answer");
  };

  const handleNextSet = () => {
    if (currentSetIndex + 1 < totalRounds) {
      startSequenceForSet(currentSetIndex + 1);
    } else {
      if (revealMode === "end") {
          startSummarySequence();
      } else {
          // Restart practice mode
          handleStart();
      }
    }
  };

  const startSummarySequence = () => {
      setPhase("summary");
      setRevealedSummaryCount(0);

      // Animate revealing one by one
      sets.slice(0, totalRounds).forEach((_, idx) => {
          setTimeout(() => {
              setRevealedSummaryCount(prev => prev + 1);
              playSound("ding");
          }, (idx + 1) * 800);
      });
  };

  const handleBackToSettings = () => {
    clearTimers();
    setPhase("settings");
    setAnswer(null);
    setCurrentNumberIndex(0);
    setRevealedSummaryCount(0);
  };

  useImperativeHandle(ref, () => ({
    openSettings: handleBackToSettings,
  }));

  // --- RENDER HELPERS ---
  const currentSet = sets[currentSetIndex] || [];
  const numbersToShow = Math.max(1, Math.min(numbersPerSet, 20));

  const renderDisplayContent = () => {
    if (phase === "settings" || phase === "getready" || !currentSet.length) return null;

    const val = currentSet[currentNumberIndex];
    const isLast = currentNumberIndex === numbersToShow - 1;

    // Determine font size based on value length to prevent overflow
    const fontSizeClass = Math.abs(val) > 999 ? "text-[8rem] sm:text-[10rem]" : "text-[10rem] sm:text-[14rem]";

    return (
      <div 
        key={currentNumberIndex} // Key forces re-render for animation
        className="animate-pop-in flex items-center justify-center gap-4 relative"
      >
        <span className={`
          ${fontSizeClass} font-black tracking-tighter leading-none
          ${val < 0 ? 'text-red-500' : 'text-slate-800'}
          drop-shadow-2xl
        `}>
          {val >= 0 ? val : Math.abs(val)}
        </span>
        
        {val < 0 && (
          <span className="text-6xl sm:text-8xl font-black text-red-400 absolute -left-16 sm:-left-24 top-1/2 -translate-y-1/2">
             −
          </span>
        )}
        
        {/* BIG RED QUESTION MARK - Exact size of numbers */}
        {isLast && (
           <span className="text-[10rem] sm:text-[14rem] text-red-600 ml-8 font-black animate-pulse leading-none drop-shadow-2xl">?</span>
        )}
      </div>
    );
  };

  // --- JSX RENDER ---
  return (
    // Added pt-28 to push content below the nav bar
    <div className="w-full h-full flex flex-col items-center justify-center relative pt-28">
      
      {/* Title */}
      <div className="absolute top-24 px-8 py-3 bg-white/40 backdrop-blur-md rounded-b-3xl border border-white/50 shadow-sm z-10">
        <h2 className="text-xl font-black text-slate-700 tracking-widest uppercase flex items-center gap-2">
          <span className="text-cyan-500">⚡</span> 
          {phase === "settings" ? "FLASHCARD SETUP" : 
           phase === "summary" ? t(lang, "summary") :
           `SET ${currentSetIndex + 1} / ${totalRounds}`} 
          <span className="text-cyan-500">⚡</span>
        </h2>
      </div>

      {/* PHASE: SETTINGS */}
      {phase === "settings" && (
        <div className="flex-1 w-full flex items-center justify-center animate-in fade-in zoom-in duration-500 px-4 pb-8 overflow-y-auto">
          <div className="bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white max-w-3xl w-full flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Speed Control */}
                <div className="space-y-2">
                  <label className="text-slate-500 font-bold uppercase tracking-widest text-sm ml-2">
                    {t(lang, "speed")}
                  </label>
                  <div className="relative">
                     <input
                       type="number" min={0.3} max={5} step={0.1}
                       value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                       className="w-full bg-slate-100 rounded-2xl px-6 py-3 text-2xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-200 transition-all text-center"
                     />
                     <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">SEC</div>
                  </div>
                </div>

                {/* Total Rounds Control */}
                <div className="space-y-2">
                  <label className="text-slate-500 font-bold uppercase tracking-widest text-sm ml-2">
                    {t(lang, "rounds")}
                  </label>
                  <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl">
                      <button onClick={() => setTotalRounds(Math.max(1, totalRounds - 1))} className="w-12 h-12 rounded-xl bg-white text-2xl font-bold text-cyan-600 shadow-sm">−</button>
                      <div className="flex-1 text-center text-3xl font-black text-slate-800">{totalRounds}</div>
                      <button onClick={() => setTotalRounds(Math.min(50, totalRounds + 1))} className="w-12 h-12 rounded-xl bg-white text-2xl font-bold text-cyan-600 shadow-sm">+</button>
                  </div>
                </div>
            </div>

            {/* Numbers Per Set Control */}
            <div className="space-y-2">
               <label className="text-slate-500 font-bold uppercase tracking-widest text-sm ml-2">
                 {t(lang, "numset")}
               </label>
               <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl">
                  <button onClick={() => setNumbersPerSet(Math.max(1, numbersPerSet - 1))} className="w-14 h-14 rounded-xl bg-white text-3xl font-bold text-cyan-600 shadow-sm">−</button>
                  <div className="flex-1 text-center text-4xl font-black text-slate-800">{numbersPerSet}</div>
                  <button onClick={() => setNumbersPerSet(Math.min(20, numbersPerSet + 1))} className="w-14 h-14 rounded-xl bg-white text-3xl font-bold text-cyan-600 shadow-sm">+</button>
               </div>
            </div>

            {/* Game Mode (Reveal) */}
            <div className="space-y-2">
                <label className="text-slate-500 font-bold uppercase tracking-widest text-sm ml-2">
                    {t(lang, "revealMode")}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setRevealMode("each")}
                        className={`flex-1 py-4 px-4 rounded-xl font-bold text-lg transition-all border-2 ${revealMode === "each" ? "bg-cyan-100 border-cyan-500 text-cyan-800" : "bg-slate-50 border-transparent text-slate-400"}`}
                    >
                        {t(lang, "modeEach")}
                    </button>
                    <button 
                        onClick={() => setRevealMode("end")}
                        className={`flex-1 py-4 px-4 rounded-xl font-bold text-lg transition-all border-2 ${revealMode === "end" ? "bg-cyan-100 border-cyan-500 text-cyan-800" : "bg-slate-50 border-transparent text-slate-400"}`}
                    >
                        {t(lang, "modeEnd")}
                    </button>
                </div>
            </div>

            <button
              onClick={handleStart}
              className="mt-2 w-full py-5 rounded-2xl text-2xl sm:text-3xl font-black text-white uppercase tracking-widest bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_15px_40px_rgba(6,182,212,0.4)] hover:shadow-[0_20px_50px_rgba(6,182,212,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
            >
              {t(lang, "start")}
            </button>
          </div>
        </div>
      )}

      {/* PHASE: GET READY */}
      {phase === "getready" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md">
           <div className="text-[8rem] sm:text-[12rem] font-black text-white leading-none drop-shadow-[0_0_50px_rgba(6,182,212,0.8)] animate-bounce text-center">
             {readyText}
           </div>
        </div>
      )}

      {/* PHASE: SUMMARY (COMPETITION MODE END) */}
      {phase === "summary" && (
        <div className="flex-1 w-full flex flex-col items-center justify-start animate-in fade-in duration-500 px-4 pb-8 overflow-y-auto">
            <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6 sm:p-8 mt-4">
                <div className="grid grid-cols-1 gap-4">
                    {sets.slice(0, totalRounds).map((set, idx) => {
                        const isRevealed = revealedSummaryCount > idx;
                        const nps = Math.max(1, Math.min(numbersPerSet, 20));
                        const answerVal = set.slice(0, nps).reduce((a, b) => a + b, 0);
                        
                        return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <span className="bg-cyan-500 text-white font-black w-10 h-10 flex items-center justify-center rounded-full">
                                        {idx + 1}
                                    </span>
                                    <div className="flex flex-wrap gap-2 text-slate-400 font-bold text-sm sm:text-lg">
                                        {set.slice(0, nps).map((n, i) => (
                                            <span key={i}>{n > 0 && i > 0 ? '+' : ''}{n}</span>
                                        ))}
                                        <span>=</span>
                                    </div>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black w-32 text-right">
                                    {isRevealed ? (
                                        <span className="text-emerald-500 animate-pop-in inline-block">
                                            {answerVal}
                                        </span>
                                    ) : (
                                        <span className="text-slate-200">?</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                {revealedSummaryCount >= totalRounds && (
                    <button
                        onClick={handleBackToSettings}
                        className="mt-8 w-full py-4 rounded-2xl bg-slate-800 text-white font-black text-xl uppercase shadow-xl hover:bg-slate-700"
                    >
                        {t(lang, "start")}
                    </button>
                )}
            </div>
        </div>
      )}

      {/* PHASE: PLAYING / WAITING / ANSWER */}
      {(phase === "playing" || phase === "waiting" || phase === "answer") && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl gap-8">
           
           {/* Monitor Screen */}
           <div className="
             relative w-full aspect-video max-h-[50vh] bg-white rounded-[3rem] 
             shadow-[0_40px_100px_rgba(0,0,0,0.1),inset_0_0_0_8px_rgba(255,255,255,0.5)] 
             flex items-center justify-center overflow-hidden border border-slate-200
           ">
              {/* Screen Glare */}
              <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none z-10" />

              {/* ANSWER DISPLAY (Only in 'each' mode or if explicitly shown) */}
              {phase === "answer" && answer !== null ? (
                 <div className="relative z-20 flex flex-col items-center animate-in zoom-in-50 duration-500">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border border-slate-200 px-4 py-1 rounded-full">
                       Result
                    </div>
                    <div className="text-[10rem] sm:text-[12rem] font-black text-emerald-500 leading-none drop-shadow-xl">
                       {answer}
                    </div>
                 </div>
              ) : (
                 // FLASHING NUMBERS
                 <div className="relative z-20">
                    {renderDisplayContent()}
                 </div>
              )}
           </div>

           {/* CONTROLS */}
           <div className="h-24 flex items-center gap-4">
              {phase === "waiting" && (
                <>
                    {/* If Competition Mode ('end'), show Next Round/Finish instead of Answer */}
                    {revealMode === "end" ? (
                         currentSetIndex < totalRounds - 1 ? (
                            <button
                              onClick={handleNextSet}
                              className="px-12 py-4 rounded-full bg-cyan-500 text-white font-black text-xl uppercase tracking-widest shadow-xl hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all"
                            >
                              {t(lang, "nextRound")} →
                            </button>
                         ) : (
                            <button
                              onClick={handleNextSet} // Will trigger summary
                              className="px-12 py-4 rounded-full bg-emerald-500 text-white font-black text-xl uppercase tracking-widest shadow-xl hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all animate-pulse"
                            >
                              {t(lang, "finish")}
                            </button>
                         )
                    ) : (
                        // Practice Mode ('each')
                        <button
                          onClick={handleShowAnswer}
                          className="px-12 py-4 rounded-full bg-slate-800 text-white font-black text-xl uppercase tracking-widest shadow-xl hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all"
                        >
                          {t(lang, "showAnswer")}
                        </button>
                    )}
                </>
              )}
              
              {/* In Practice Mode, after showing answer, show Next Set */}
              {phase === "answer" && (
                <button
                  onClick={handleNextSet}
                  className="px-12 py-4 rounded-full bg-emerald-500 text-white font-black text-xl uppercase tracking-widest shadow-xl hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all"
                >
                  {t(lang, "nextSet")} →
                </button>
              )}
           </div>

        </div>
      )}

      <style jsx>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
});

export default FlashcardGame;