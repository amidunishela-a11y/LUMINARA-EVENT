import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  Music, 
  Phone, 
  Share2, 
  Sparkles, 
  Play, 
  Instagram, 
  Facebook, 
  Image as ImageIcon, 
  Wand2, 
  Copy, 
  Loader2, 
  Navigation, 
  Crown, 
  Star,
  CheckCircle2,
  Trophy,
  User,
  Database,
  Heart,
  Diamond
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, updateDoc, increment, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

// --- CONFIGURATION ---
// Google Script URL - Sheet madhe data pathvayla ha URL vapra
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwLEirgkm6ECbmaqzSo8UJVJdv3et5dP66izilkuhFgAETWeMy3L6yEwauEYcO7BqFN/exec";

// Firebase Prarambh (Firebase Initialization)
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'luminara-2022-reunion';

/**
 * Mouse chya mage smoke effect dakhvanyasathi canvas component
 */
const FluidSmokeEffect = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true
      };
      
      // Nave particles tayar kara
      for (let i = 0; i < 3; i++) {
        particles.current.push({
          x: mouse.current.x,
          y: mouse.current.y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          alpha: 0.6,
          size: Math.random() * 30 + 10,
          color: Math.random() > 0.5 ? '168, 85, 247' : '59, 130, 246',
          life: 1.0
        });
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i];
        p.x += p.vx; p.y += p.vy;
        p.alpha -= 0.008; p.size += 0.5; p.life -= 0.01;
        if (p.life <= 0) { particles.current.splice(i, 1); i--; continue; }
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(${p.color}, ${p.alpha})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    handleResize(); animate();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none opacity-60" style={{ mixBlendMode: 'screen' }} />;
};

const App = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [userNameInput, setUserNameInput] = useState("");
  const [userPhoneInput, setUserPhoneInput] = useState(""); 
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const details = {
    schoolName: "POLPITHIGAMA NATIONAL COLLEGE",
    batchYear: "CLASS OF 2022",
    theme: "LUMINARA",
    date: "2026 පෙබරවාරි 20",
    time: "10 A.M.",
    venue: "HOTEL WHITE DIAMOND",
    ticketPrice: "Rs. 3000/=",
    contact: "077 123 4567",
    logoUrl: "https://cdn-icons-png.flaticon.com/512/3665/3665939.png"
  };

  // Firebase Auth setup (Authentication)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Firebase Live Sync (Real-time data update)
  useEffect(() => {
    if (!user) return;
    const attendeesCol = collection(db, 'artifacts', appId, 'public', 'data', 'attendees');
    const userDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'votes', 'rsvpStatus');

    const unsubscribeAttendees = onSnapshot(attendeesCol, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAttendees(list);
    }, (err) => console.error("Sync Error:", err));

    const checkStatus = async () => {
      try {
        const snap = await getDoc(userDoc);
        if (snap.exists() && snap.data().voted) setHasVoted(true);
      } catch (err) { console.error("Status check error:", err); }
    };
    checkStatus();
    return () => unsubscribeAttendees();
  }, [user]);

  /**
   * Confirm button dabavlyavar Name ani Phone donhi update kara
   */
  const handleRsvp = async () => {
    const enteredName = userNameInput.trim();
    const enteredPhone = userPhoneInput.trim();
    
    if (!user || !enteredName || !enteredPhone || isVoting || hasVoted) return;
    
    setIsVoting(true);
    try {
      const attendeesCol = collection(db, 'artifacts', appId, 'public', 'data', 'attendees');
      const userDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'votes', 'rsvpStatus');
      
      // 1. Firebase madhe save kara (Real-time list sathi)
      await addDoc(attendeesCol, { 
        name: enteredName, 
        phone: enteredPhone,
        uid: user.uid, 
        createdAt: serverTimestamp() 
      });
      await setDoc(userDoc, { voted: true }, { merge: true });
      
      // 2. Google Sheet la data pathva - Name ani Phone Number donhi
      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: enteredName, 
          phone: enteredPhone 
        }),
      }).then(() => console.log("Google Sheet madhe save jhale!"))
        .catch(e => console.warn("Sheet update failure", e));
      
      setHasVoted(true);
      setUserNameInput("");
      setUserPhoneInput("");
    } catch (error) { 
      console.error('RSVP Error:', error); 
    } finally { 
      setIsVoting(false); 
    }
  };

  useEffect(() => { setIsVisible(true); }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center p-4 sm:p-10 selection:bg-purple-500 selection:text-white overflow-x-hidden">
      
      {/* NAKSHI VIBHAG (Decorative Section) */}
      {!hasVoted && (
        <div className="w-full max-w-4xl py-12 flex flex-col items-center justify-center relative animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-10 text-white/10">
            <div className="h-[0.5px] w-32 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
            <div className="relative group">
              <Crown size={28} className="text-purple-500/30 group-hover:text-purple-500/60 transition-colors duration-700" />
              <div className="absolute inset-0 blur-xl bg-purple-500/20 animate-pulse"></div>
            </div>
            <div className="h-[0.5px] w-32 bg-gradient-to-l from-transparent via-purple-500/20 to-transparent"></div>
          </div>
          
          <div className="flex gap-16 mt-6 opacity-20">
             <Star size={10} className="animate-spin-slow text-white/40" />
             <Diamond size={10} className="animate-pulse text-white/40" />
             <Star size={10} className="animate-spin-slow text-white/40" />
          </div>

          <div className="absolute top-0 w-64 h-32 bg-purple-600/5 blur-[100px] rounded-full -z-10"></div>
        </div>
      )}

      {/* Mukhy Container */}
      <div className="relative w-full max-w-[500px] aspect-[4/8.8] flex items-center justify-center mt-4">
        
        {/* AMANTRAN VIEW (Invitation) */}
        {!hasVoted ? (
          <div className={`absolute inset-0 rounded-[80px] overflow-hidden shadow-[0_0_150px_rgba(168,85,247,0.25)] transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'}`}>
            <div className="absolute inset-0 bg-[#070707]"></div>
            <FluidSmokeEffect />
            <div className="absolute top-[-10%] left-[-10%] w-[100%] h-[50%] bg-purple-600/15 blur-[180px] rounded-full"></div>
            <div className="absolute bottom-[-5%] right-[-10%] w-[90%] h-[40%] bg-blue-600/15 blur-[180px] rounded-full"></div>

            <div className="absolute inset-0 p-10 flex flex-col items-center z-10 text-center">
              <div className="w-full text-center pt-4 mb-8 font-sans">
                <p className="text-[10px] tracking-[0.8em] font-black text-purple-400 uppercase mb-4 px-4 leading-relaxed">{details.schoolName}</p>
                <div className="flex justify-center items-center gap-4 opacity-30">
                  <div className="h-[1px] w-14 bg-white"></div>
                  <Sparkles size={16} />
                  <div className="h-[1px] w-14 bg-white"></div>
                </div>
                <h2 className="text-[11px] font-bold tracking-[0.5em] text-white/40 uppercase mt-6 italic">{details.batchYear} REUNION</h2>
              </div>

              <div className="relative mb-8 text-center flex flex-col items-center font-sans">
                <h1 className="relative text-7xl font-black italic tracking-tighter leading-none mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-800 drop-shadow-3xl">LUMINARA</span>
                </h1>
                <img src={details.logoUrl} className="w-14 h-14 object-contain mb-4 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] opacity-80" alt="Logo" />
                <p className="text-[11px] font-black tracking-[0.4em] text-purple-500 uppercase italic">— RELIVE THE MEMORIES —</p>
              </div>

              <div className="w-full mb-8 relative px-2 grid grid-cols-1 gap-4 font-sans">
                <div className="relative w-full rounded-[45px] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-3xl flex flex-col items-center justify-center p-6 shadow-inner group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-50"></div>
                  <div className="relative z-10 text-center w-full">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-white">{String(attendees.length)}</span>
                        <span className="text-xs font-bold text-purple-500 italic uppercase tracking-widest font-sans">Attending</span>
                      </div>
                    </div>
                    
                    {/* INPUT SECTION */}
                    <div className="space-y-3">
                      <input 
                        className="w-full bg-black/40 border border-white/10 p-3 rounded-2xl text-xs outline-none focus:border-purple-500 text-center placeholder:text-gray-500 transition-all"
                        placeholder="ENTER YOUR NAME..."
                        value={userNameInput}
                        onChange={(e) => setUserNameInput(e.target.value)}
                      />
                      <input 
                        className="w-full bg-black/40 border border-white/10 p-3 rounded-2xl text-xs outline-none focus:border-purple-500 text-center placeholder:text-gray-500 transition-all"
                        placeholder="PHONE NUMBER..."
                        type="tel"
                        value={userPhoneInput}
                        onChange={(e) => setUserPhoneInput(e.target.value)}
                      />
                      <button 
                        onClick={handleRsvp}
                        disabled={isVoting || !userNameInput.trim() || !userPhoneInput.trim()}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-30 font-sans"
                      >
                        {isVoting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                        CONFIRM ATTENDANCE
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative w-full h-[160px] rounded-[45px] overflow-hidden border border-white/5 bg-black/40 backdrop-blur-xl p-6 flex flex-col shadow-2xl font-sans">
                  <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                    <Users size={14} className="text-purple-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-sans">LIVE ATTENDEE LIST</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {attendees.length > 0 ? attendees.map((att, idx) => (
                      <div key={att.id || idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl text-left">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-black">{att.name ? att.name.charAt(0).toUpperCase() : '?'}</div>
                        <span className="text-[11px] font-bold text-gray-200 truncate font-sans">{att.name}</span>
                        <Star size={10} className="ml-auto text-purple-400 opacity-50" />
                      </div>
                    )) : <p className="text-[9px] font-bold italic opacity-20 text-center font-sans uppercase tracking-widest">Be the first to confirm!</p>}
                  </div>
                </div>
              </div>

              <div className="w-full flex-1 flex flex-col items-center justify-between text-center mt-auto font-sans">
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2 opacity-40 text-xs"><MapPin size={12} /><span className="text-[9px] font-black uppercase tracking-widest">VENUE</span></div>
                  <h3 className="text-lg font-black tracking-tight text-white italic drop-shadow-lg leading-tight uppercase font-sans">{details.venue}</h3>
                </div>
                <div className="w-full flex justify-between items-center px-4 mb-6 font-sans">
                  <div className="text-left text-[8px] font-black text-gray-600 uppercase tracking-widest"><p>DATE</p><p className="text-sm text-white font-sans">{details.date}</p></div>
                  <div className="h-10 w-[1px] bg-white/10"></div>
                  <div className="text-right text-[8px] font-black text-gray-600 uppercase tracking-widest"><p>RSVP</p><p className="text-sm text-white font-sans">{details.contact}</p></div>
                </div>
                <div className="w-full flex flex-col items-center gap-3 pt-4 border-t border-white/5 opacity-20 font-sans">
                  <div className="flex gap-6"><Instagram size={16} /><Facebook size={16} /><Share2 size={16} /></div>
                  <p className="text-[8px] font-black tracking-[0.6em] uppercase italic font-sans">LUMINARA 2022 O/L</p>
                </div>
              </div>
            </div>
            <div className="absolute top-12 left-12 w-20 h-20 border-t border-l border-white/10 rounded-tl-[60px]"></div>
            <div className="absolute bottom-12 right-12 w-20 h-20 border-b border-r border-white/10 rounded-br-[60px]"></div>
          </div>
        ) : (
          /* THANK YOU VIEW (Shubhechha) */
          <div className="absolute inset-0 rounded-[80px] overflow-hidden shadow-[0_0_200px_rgba(168,85,247,0.4)] animate-in zoom-in-95 fade-in duration-1000 flex flex-col">
            <div className="absolute inset-0 bg-[#0a0a0a]"></div>
            <FluidSmokeEffect />
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black to-black"></div>

            <div className="absolute inset-0 p-12 flex flex-col items-center z-10 text-center overflow-y-auto custom-scrollbar">
              
              <div className="flex flex-col items-center mb-8 shrink-0">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500 blur-[60px] opacity-40 animate-pulse"></div>
                  <div className="relative bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-3xl">
                    <CheckCircle2 size={60} className="text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                  </div>
                </div>

                <h1 className="text-4xl font-black italic tracking-tighter leading-tight font-sans mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-500 uppercase">
                    THANK YOU<br/>CONFIRMED!
                  </span>
                </h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] leading-relaxed">
                  OYAA DEN LIST EKATA<br/>ETHLATH WELA TIYENNE
                </p>
              </div>

              {/* LIVE LIST INSIDE THANK YOU PAGE */}
              <div className="w-full bg-white/5 backdrop-blur-md rounded-[50px] border border-white/10 p-6 flex flex-col mb-8 shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 opacity-50 rounded-[50px]"></div>
                
                <div className="relative z-10 flex flex-col h-[280px]">
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-400" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-white/60 font-sans">LIVE MATES LIST</h4>
                    </div>
                    <div className="px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
                       <span className="text-[10px] font-black text-purple-400 font-sans">{attendees.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar text-left">
                    {attendees.map((att, idx) => (
                      <div key={att.id || idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-[20px] animate-in slide-in-from-bottom-2 duration-500">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xs font-black shadow-lg">
                          {att.name ? att.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-gray-200 font-sans">{att.name}</span>
                           <span className="text-[8px] text-gray-500 uppercase tracking-widest">Joined the crew</span>
                        </div>
                        <Star size={12} className="ml-auto text-purple-500 opacity-40 animate-spin-slow" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 space-y-6">
                <div className="flex items-center gap-4 justify-center opacity-30">
                  <div className="h-[1px] w-12 bg-white"></div>
                  <Calendar size={14} />
                  <div className="h-[1px] w-12 bg-white"></div>
                </div>
                
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em] italic">FEBRUARY 20, 2026 | 10 AM</p>
                   <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{details.venue}</p>
                </div>

                <div className="flex flex-col items-center gap-3 py-6 group">
                   <Heart size={20} className="text-white/10 group-hover:text-purple-500 transition-colors duration-500" fill="currentColor" />
                   <p className="text-[7px] font-black tracking-[0.8em] text-white/5 uppercase italic">LUMINARA FOREVER</p>
                </div>
              </div>
            </div>

            <div className="absolute top-12 left-12 w-24 h-24 border-t-2 border-l-2 border-purple-500/20 rounded-tl-[60px] pointer-events-none"></div>
            <div className="absolute bottom-12 right-12 w-24 h-24 border-b-2 border-r-2 border-purple-500/20 rounded-br-[60px] pointer-events-none"></div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 6s ease infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.2);
          border-radius: 10px;
        }
        ::selection {
          background: #a855f7;
          color: white;
        }
      `}</style>
      
      <div className="mt-12 opacity-10 text-[8px] font-black tracking-[0.5em] uppercase text-center font-sans">
        <p>© 2026 LUMINARA PRODUCTIONS</p>
      </div>
    </div>
  );
};

export default App;