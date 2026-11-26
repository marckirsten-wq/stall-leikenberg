import React, { useState, useEffect } from 'react';
import {
  Home,
  ClipboardList,
  CalendarDays,
  MoreHorizontal,
  Plus,
  X,
  Phone,
  AlertTriangle,
  MessageSquare,
  Send,
  CheckCircle,
  Heart,
  Users,
  Edit2,
  Trash2,
  ShieldCheck,
  User,
  Info,
  Camera,
  Moon
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, setDoc, deleteDoc } from 'firebase/firestore';

// --- VEREINSLOGO (FREIGESTELLT AUS PDF) ---
const STALL_LOGO = "data:image/png;base64,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";

// --- FIREBASE INITIALIZATION ---
let app, auth, db;
const firebaseConfig = {
  apiKey: "AIzaSyCztYn5T0Cj1eQePrA_ZnWZcACq7L4OF3k",
  authDomain: "stall-app-5efb9.firebaseapp.com",
  databaseURL: "https://stall-app-5efb9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stall-app-5efb9",
  storageBucket: "stall-app-5efb9.firebasestorage.app",
  messagingSenderId: "1025488266065",
  appId: "1:1025488266065:web:89d34ff3b65395f69be970",
  measurementId: "G-1537CSM5SQ"
};

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase config error:", e);
}
const appId = typeof __app_id !== 'undefined' ? __app_id : 'stall-app-default';

// --- HELPER FUNCTIONS ---
const get4Weeks = () => {
  const weeks = [];
  const now = new Date();
  
  const dayOfWeek = now.getDay(); // 0 = Sonntag, 1 = Montag
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() + diffToMonday);
  
  const getWeekNumber = (d) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  };

  for (let w = 0; w < 4; w++) {
    const days = [];
    const weekStart = new Date(startOfThisWeek);
    weekStart.setDate(weekStart.getDate() + (w * 7));
    const kw = getWeekNumber(weekStart);

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push({
        iso: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
      });
    }
    weeks.push({ kw, days });
  }
  return weeks;
};

const getNightBlanketId = (horse) => {
  if (horse.nightBlanketId !== undefined) return horse.nightBlanketId;
  return horse.keepBlanketAtNight ? horse.activeBlanketId : null;
};

const STORAGE_KEY = 'stall_leikenberg_user';

export default function StallApp() {
  // Auth State (mit lokalem Speicher für dauerhaften Login)
  const [fbUser, setFbUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  
  // Data State (Optimistic UI)
  const [profiles, setProfiles] = useState([]);
  const [horses, setHorses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [damages, setDamages] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('home');
  const [planSubTab, setPlanSubTab] = useState('dienste');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [toast, setToast] = useState(null);
  const [shiftPickerSlot, setShiftPickerSlot] = useState(null); // { date, type, label }
  
  // --- Form States ---
  const [newMessage, setNewMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBooking, setNewBooking] = useState({ type: 'Reitplatz', date: '', startTime: '', endTime: '', note: '' });
  const [newRequest, setNewRequest] = useState({ task: 'Misten', startDate: '', endDate: '', note: '' });
  const [newDamage, setNewDamage] = useState({ location: '', description: '' });

  // Horse Form State
  const [isEditingHorse, setIsEditingHorse] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [horseFormData, setHorseFormData] = useState({
    name: '', feed: '', notes: '', image: '', vet: '', vetPhone: '', farrier: '', farrierPhone: '',
    activeBlanketId: null, nightBlanketId: null, blankets: [], team: []
  });

  // --- 1. FIREBASE AUTH ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (customTokenError) {
            console.warn("Custom token failed. Falling back to anonymous auth.", customTokenError);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFbUser);
    return () => unsubscribe();
  }, []);

  // --- 2. FIRESTORE SUBSCRIPTIONS ---
  useEffect(() => {
    if (!fbUser || !db) return;
    const publicPath = (col) => collection(db, 'artifacts', appId, 'public', 'data', col);
    const unsubs = [];
    
    const subscribe = (colName, setter) => {
      return onSnapshot(publicPath(colName), (snapshot) => {
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => console.error(`Snapshot error on ${colName}:`, err));
    };

    unsubs.push(subscribe('profiles', setProfiles));
    unsubs.push(subscribe('horses', setHorses));
    unsubs.push(subscribe('messages', setMessages));
    unsubs.push(subscribe('shifts', setShifts));
    unsubs.push(subscribe('bookings', setBookings));
    unsubs.push(subscribe('requests', setRequests));
    unsubs.push(subscribe('damages', setDamages));

    return () => unsubs.forEach(unsub => unsub());
  }, [fbUser]);

  // --- 3. GESPEICHERTEN NUTZER MIT FIRESTORE AKTUELL HALTEN ---
  useEffect(() => {
    if (!currentUser || profiles.length === 0) return;
    const freshUser = profiles.find(p => p.id === currentUser.id);
    if (freshUser) {
      if (JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(freshUser);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
        } catch (e) {}
      }
    } else {
      setCurrentUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  }, [profiles, currentUser]);

  // --- HELPER: SHOW TOAST ---
  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  // --- HELPER: SYNC TO FIREBASE ---
  const syncToFirebase = async (colName, id, data, isDelete = false) => {
    if (!db || !fbUser) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', colName, id);
      if (isDelete) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, data, { merge: true });
      }
    } catch (err) {
      console.error(`Error syncing ${colName}:`, err);
    }
  };

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    
    const userEmail = loginForm.email.trim().toLowerCase();
    const user = profiles.find(u => u.email.trim().toLowerCase() === userEmail && u.password === loginForm.password);
    
    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (e) {}
      showToast(`Willkommen zurück, ${user.name}!`);
    } else {
      setAuthError('E-Mail oder Passwort falsch.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    const newUserEmail = loginForm.email.trim().toLowerCase();
    
    if (profiles.some(u => u.email.trim().toLowerCase() === newUserEmail)) {
      setAuthError('E-Mail wird bereits verwendet.');
      return;
    }
    
    const newId = Date.now().toString();
    const role = newUserEmail === 'kirstenmarc@outlook.de' ? 'admin' : 'user';
    
    const newUser = { 
      id: newId, 
      email: loginForm.email, 
      password: loginForm.password, 
      name: loginForm.name, 
      role: role, 
      createdAt: new Date().toISOString() 
    };
    
    setProfiles(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {}
    
    if (role === 'admin') {
      showToast('Admin-Konto erfolgreich erstellt!');
    } else {
      showToast('Registrierung erfolgreich!');
    }
    
    await syncToFirebase('profiles', newId, newUser);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Das Passwort muss mindestens 6 Zeichen lang sein!', true);
      return;
    }
    const updatedUser = { ...currentUser, password: newPassword };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (e) {}
    setNewPassword('');
    
    await syncToFirebase('profiles', currentUser.id, { password: newPassword });
    showToast('Dein Passwort wurde erfolgreich geändert!');
  };

  const canEditHorse = (horse) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const uName = currentUser.name.trim().toLowerCase();
    return (horse.team || []).some(member => (member.name || '').trim().toLowerCase() === uName);
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const newId = Date.now().toString();
    const msgData = { id: newId, text: newMessage, author: currentUser.name, createdAt: new Date().toISOString() };
    
    setMessages(prev => [...prev, msgData]);
    setNewMessage('');
    showToast('Nachricht gepostet!');

    await syncToFirebase('messages', newId, msgData);
  };

  const deleteMessage = async (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    showToast('Nachricht gelöscht!');
    await syncToFirebase('messages', id, null, true);
  };

  const resolveDamage = async (id) => {
    setDamages(prev => prev.map(d => d.id === id ? { ...d, status: 'resolved', resolvedBy: currentUser.name } : d));
    showToast('Schaden als behoben markiert!');
    await syncToFirebase('damages', id, { status: 'resolved', resolvedBy: currentUser.name });
  };

  const resolveRequest = async (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved', resolvedBy: currentUser.name } : r));
    showToast('Dienst übernommen!');
    await syncToFirebase('requests', id, { status: 'resolved', resolvedBy: currentUser.name });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setHorseFormData(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const saveHorse = async (e) => {
    e.preventDefault(); 
    if (!horseFormData.name) {
      showToast('Pferdename fehlt!', true);
      return;
    }

    const horseId = horseFormData.id || Date.now().toString();
    const validBlanketIds = new Set((horseFormData.blankets || []).map(b => b.id));
    const cleanActiveId = validBlanketIds.has(horseFormData.activeBlanketId) ? horseFormData.activeBlanketId : null;
    const rawNightId = getNightBlanketId(horseFormData);
    const cleanNightId = validBlanketIds.has(rawNightId) ? rawNightId : null;

    const sanitizedData = {
      id: horseId,
      name: horseFormData.name || '',
      feed: horseFormData.feed || '',
      notes: horseFormData.notes || '',
      image: horseFormData.image || '',
      vet: horseFormData.vet || '',
      vetPhone: horseFormData.vetPhone || '',
      farrier: horseFormData.farrier || '',
      farrierPhone: horseFormData.farrierPhone || '',
      activeBlanketId: cleanActiveId,
      nightBlanketId: cleanNightId,
      keepBlanketAtNight: Boolean(cleanNightId),
      blankets: (horseFormData.blankets || []).map(b => ({ id: b.id, name: b.name || '', description: b.description || '' })),
      team: (horseFormData.team || []).map(t => ({ id: t.id, role: t.role || '', name: t.name || '', phone: t.phone || '' })),
      createdAt: horseFormData.createdAt || new Date().toISOString()
    };

    if (horseFormData.id) {
      setHorses(prev => prev.map(h => h.id === horseId ? sanitizedData : h));
    } else {
      setHorses(prev => [...prev, sanitizedData]);
    }
    
    setIsEditingHorse(false);
    setSelectedHorse(null);
    showToast('Pferd erfolgreich gespeichert!');

    await syncToFirebase('horses', horseId, sanitizedData);
  };

  const deleteHorse = async (id) => {
    setHorses(prev => prev.filter(h => h.id !== id));
    setIsEditingHorse(false);
    setSelectedHorse(null);
    showToast('Pferd gelöscht!');
    await syncToFirebase('horses', id, null, true);
  };

  const toggleBlanket = async (horseId, blanketId) => {
    const newVal = blanketId === "" ? null : blanketId;
    const targetHorse = horses.find(h => h.id === horseId);
    const currentNightId = targetHorse ? getNightBlanketId(targetHorse) : null;
    const updates = { activeBlanketId: newVal, nightBlanketId: currentNightId };
    setHorses(prev => prev.map(h => h.id === horseId ? { ...h, ...updates } : h));
    showToast('Decke für tagsüber aktualisiert!');
    await syncToFirebase('horses', horseId, updates);
  };

  const toggleNightBlanket = async (horseId, blanketId) => {
    const newVal = blanketId === "" ? null : blanketId;
    const updates = { nightBlanketId: newVal, keepBlanketAtNight: Boolean(newVal) };
    setHorses(prev => prev.map(h => h.id === horseId ? { ...h, ...updates } : h));
    showToast(newVal ? 'Nacht-Decke gespeichert!' : 'Abends keine Decke!');
    await syncToFirebase('horses', horseId, updates);
  };

  // --- DIENSTPLAN: PFERDE-AUSWAHL & EINTRAGEN ---
  const addShift = async (date, type, horse = null) => {
    const newId = Date.now().toString();
    const shiftData = {
      id: newId,
      date,
      type,
      userId: currentUser.id,
      userName: currentUser.name,
      horseId: horse ? horse.id : null,
      horseName: horse ? horse.name : null
    };
    setShifts(prev => [...prev, shiftData]);
    setShiftPickerSlot(null);
    showToast(horse ? `Dienst für ${horse.name} eingetragen!` : 'Erfolgreich eingetragen!');
    await syncToFirebase('shifts', newId, shiftData);
  };

  const handleOpenShiftPicker = (date, type, label) => {
    const myHorses = sortedHorses.filter(h => canEditHorse(h));
    if (myHorses.length === 0) {
      addShift(date, type, null);
      return;
    }
    if (myHorses.length === 1 && currentUser.role !== 'admin') {
      addShift(date, type, myHorses[0]);
      return;
    }
    setShiftPickerSlot({ date, type, label });
  };

  const canRemoveShift = (shift) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (shift.userId === currentUser.id) return true;
    if (shift.horseId) {
      const horse = horses.find(h => h.id === shift.horseId);
      if (horse && canEditHorse(horse)) return true;
    }
    return false;
  };

  const removeShift = async (shiftId) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    showToast('Ausgetragen!');
    await syncToFirebase('shifts', shiftId, null, true);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!newBooking.date || !newBooking.startTime || !newBooking.endTime) {
      showToast('Bitte alle Zeiten ausfüllen!', true);
      return;
    }
    const newId = Date.now().toString();
    const bookingData = { ...newBooking, id: newId, userId: currentUser.id, userName: currentUser.name, createdAt: new Date().toISOString() };
    
    setBookings(prev => [...prev, bookingData]);
    setNewBooking({ type: 'Reitplatz', date: '', startTime: '', endTime: '', note: '' });
    showToast('Anlage erfolgreich gebucht!');
    
    await syncToFirebase('bookings', newId, bookingData);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    const newId = Date.now().toString();
    const requestData = { ...newRequest, id: newId, userId: currentUser.id, userName: currentUser.name, status: 'open', createdAt: new Date().toISOString() };
    
    setRequests(prev => [...prev, requestData]);
    setNewRequest({ task: 'Misten', startDate: '', endDate: '', note: '' });
    showToast('Vertretungsgesuch gepostet!');
    setActiveTab('home');
    
    await syncToFirebase('requests', newId, requestData);
  };

  const submitDamage = async (e) => {
    e.preventDefault();
    const newId = Date.now().toString();
    const damageData = { ...newDamage, id: newId, userId: currentUser.id, userName: currentUser.name, status: 'open', createdAt: new Date().toISOString() };
    
    setDamages(prev => [...prev, damageData]);
    setNewDamage({ location: '', description: '' });
    showToast('Schaden erfolgreich gemeldet!');
    setActiveTab('home');
    
    await syncToFirebase('damages', newId, damageData);
  };

  // --- DERIVED STATE ---
  const openDamages = damages.filter(d => d.status === 'open');
  const openRequests = requests.filter(r => r.status === 'open');
  const sortedMessages = [...messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const hasNotifications = openDamages.length > 0 || openRequests.length > 0;
  
  const sortedHorses = [...horses].sort((a, b) => a.name.localeCompare(b.name));
  const eligibleShiftHorses = sortedHorses.filter(h => canEditHorse(h));
  const blanketHorses = sortedHorses.filter(h => h.activeBlanketId);
  const nightBlanketHorses = sortedHorses.filter(h => getNightBlanketId(h));
  const nightOnlyHorses = sortedHorses.filter(h => !h.activeBlanketId && getNightBlanketId(h));
  const unblanketEveningHorses = blanketHorses.filter(h => !getNightBlanketId(h));

  const weeksData = get4Weeks();

  // --- RENDER LOGIN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans text-black">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border border-stone-300">
          <div className="text-center mb-6">
            <img
              src={STALL_LOGO}
              alt="Stallgemeinschaft Leikenberg Logo"
              className="w-44 h-auto mx-auto mb-2 object-contain"
            />
          </div>
          
          {authError && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold text-center mb-4 border border-red-200">{authError}</div>}
          
          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">E-Mail Adresse</label>
                <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" placeholder="z.B. user@stall.de" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">Passwort</label>
                <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Dein Passwort" />
              </div>
              <button type="submit" className="w-full bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-emerald-900 transition-colors mt-2">Einloggen</button>
              
              <div className="text-sm text-stone-500 text-center pt-4">
                Neu am Stall? <br/>
                <button type="button" onClick={() => setIsLoginMode(false)} className="text-emerald-700 font-bold underline mt-1">Hier registrieren</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">Vor- & Nachname</label>
                <input type="text" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} required className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Dein Name" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">E-Mail Adresse</label>
                <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Deine E-Mail" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">Passwort festlegen</label>
                <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Mindestens 6 Zeichen" />
              </div>
              <button type="submit" className="w-full bg-amber-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-amber-800 transition-colors mt-2">Konto erstellen</button>
              
              <div className="text-sm text-stone-500 text-center pt-4">
                Bereits registriert? <br/>
                <button type="button" onClick={() => setIsLoginMode(true)} className="text-emerald-700 font-bold underline mt-1">Zurück zum Login</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER APP ---
  return (
    <div className="min-h-screen bg-stone-100 text-black font-sans max-w-2xl mx-auto shadow-xl relative flex flex-col pb-20">
      
      {/* GLOBAL TOAST FEEDBACK */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-2xl font-bold text-sm text-white flex items-center gap-2 transition-all ${toast.isError ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          {toast.isError ? <AlertTriangle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
          {toast.msg}
        </div>
      )}

      {/* MODAL: PFERD FÜR DIENST AUSWÄHLEN */}
      {shiftPickerSlot && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShiftPickerSlot(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-stone-300 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  {shiftPickerSlot.type === 'am' ? 'Morgendienst' : 'Abenddienst'} • {shiftPickerSlot.label}
                </span>
                <h3 className="text-lg font-black text-black mt-0.5">Für welches Pferd?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShiftPickerSlot(null)}
                className="bg-stone-100 text-stone-600 p-1.5 rounded-xl border border-gray-300 hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {eligibleShiftHorses.map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => addShift(shiftPickerSlot.date, shiftPickerSlot.type, h)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-left transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {h.image ? (
                      <img src={h.image} alt={h.name} className="w-10 h-10 rounded-full object-cover border border-emerald-300 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-800 text-white text-base flex items-center justify-center shrink-0">
                        🐴
                      </div>
                    )}
                    <div>
                      <span className="font-extrabold text-sm text-emerald-950 block">{h.name}</span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Eintrag durch {currentUser.name}
                      </span>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-emerald-800 shrink-0" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => addShift(shiftPickerSlot.date, shiftPickerSlot.type, null)}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-gray-300 text-xs font-bold text-stone-700 transition-colors"
              >
                Ohne Pferd eintragen (nur {currentUser.name})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-emerald-900 text-white px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-1 rounded-xl shadow-sm shrink-0">
            <img
              src={STALL_LOGO}
              alt="Logo"
              className="w-8 h-9 object-contain"
            />
          </div>
          <span className="font-black text-sm block tracking-wide">Stallgemeinschaft Leikenberg</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
            {currentUser.role === 'admin' ? <ShieldCheck className="w-3 h-3"/> : <User className="w-3 h-3"/>}
            {currentUser.name}
          </span>
          <button onClick={handleLogout} className="text-[10px] text-emerald-200 hover:text-white mt-1 font-bold underline">Logout</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4">
        
        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            
            {hasNotifications && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm">
                <h3 className="text-amber-900 font-extrabold text-sm mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/> Wichtige Meldungen</h3>
                <div className="space-y-2">
                  {openDamages.map(d => (
                    <div key={d.id} className="bg-white border border-gray-300 p-3 rounded-xl text-sm flex justify-between items-start gap-2 shadow-sm">
                      <div><strong className="text-black">{d.location}:</strong> <span className="text-black">{d.description}</span><br/><span className="text-[10px] text-stone-500">Gemeldet von {d.userName}</span></div>
                      <button onClick={() => resolveDamage(d.id)} className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow shrink-0">Behoben</button>
                    </div>
                  ))}
                  {openRequests.map(r => (
                    <div key={r.id} className="bg-white border border-gray-300 p-3 rounded-xl text-sm flex justify-between items-start gap-2 shadow-sm">
                      <div><strong className="text-amber-700">{r.task} gesucht</strong> <br/><span className="text-black font-bold">{r.startDate} bis {r.endDate}</span><br/><span className="text-[10px] text-stone-500">Von {r.userName} {r.note && `(${r.note})`}</span></div>
                      <button onClick={() => resolveRequest(r.id)} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow shrink-0">Übernehmen</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {/* MORGENDIENST */}
              <div className="bg-emerald-800 text-white border border-emerald-900 rounded-2xl p-4 shadow-md">
                <h3 className="font-extrabold flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5"/> Morgendienst (Decken AN)</h3>
                {blanketHorses.length === 0 ? <p className="text-sm">Aktuell keine Decken für tagsüber nötig.</p> : (
                  <ul className="space-y-2 mt-3">
                    {blanketHorses.map(h => {
                      const nId = getNightBlanketId(h);
                      const dayBlanket = (h.blankets || []).find(b => b.id === h.activeBlanketId)?.name;
                      const nightBlanket = nId ? (h.blankets || []).find(b => b.id === nId)?.name : null;
                      return (
                        <li key={h.id} className="flex items-center justify-between gap-2 bg-emerald-900 p-2.5 rounded-xl border border-emerald-700">
                          <span className="text-sm font-bold">{h.name}</span>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span className="text-xs text-amber-300 font-bold">{dayBlanket}</span>
                            {nId && nId === h.activeBlanketId && (
                              <span className="text-[10px] bg-indigo-950 text-indigo-200 border border-indigo-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Moon className="w-3 h-3"/> + Nacht
                              </span>
                            )}
                            {nId && nId !== h.activeBlanketId && nightBlanket && (
                              <span className="text-[10px] bg-indigo-950 text-indigo-200 border border-indigo-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Moon className="w-3 h-3"/> Nachts: {nightBlanket}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {nightOnlyHorses.length > 0 && (
                  <p className="text-xs text-emerald-200 mt-3 pt-2 border-t border-emerald-700">
                    Hinweis: Bei <strong>{nightOnlyHorses.map(h => h.name).join(', ')}</strong> morgens die Nacht-Decke abnehmen (tagsüber ohne Decke).
                  </p>
                )}
              </div>

              {/* ABENDDIENST */}
              <div className="bg-stone-800 text-white border border-stone-900 rounded-2xl p-4 shadow-md">
                <h3 className="font-extrabold flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5"/> Abenddienst (Decken AUS / Nacht)</h3>
                {nightBlanketHorses.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    <div className="bg-indigo-950 border border-indigo-400 rounded-xl p-3">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-indigo-200 flex items-center gap-1.5 mb-2">
                        <Moon className="w-4 h-4 text-amber-300"/> Decke für die NACHT:
                      </p>
                      <ul className="space-y-1.5">
                        {nightBlanketHorses.map(h => {
                          const nId = getNightBlanketId(h);
                          const nightBlanket = (h.blankets || []).find(b => b.id === nId)?.name;
                          const dayBlanket = h.activeBlanketId ? (h.blankets || []).find(b => b.id === h.activeBlanketId)?.name : null;
                          const isSame = h.activeBlanketId === nId;
                          const isSwitch = Boolean(h.activeBlanketId) && !isSame;

                          return (
                            <li key={h.id} className="flex items-center justify-between gap-2 bg-indigo-900/70 px-2.5 py-2 rounded-lg text-sm">
                              <span className="font-extrabold text-white">{h.name}</span>
                              <div className="text-right">
                                {isSame && (
                                  <span className="text-xs font-bold text-amber-300">
                                    {nightBlanket} <span className="text-[10px] bg-indigo-800 text-indigo-100 px-1.5 py-0.5 rounded ml-1">anlassen</span>
                                  </span>
                                )}
                                {isSwitch && (
                                  <span className="text-xs font-bold text-amber-300">
                                    <span className="text-stone-300 line-through mr-1">{dayBlanket}</span> ➔ {nightBlanket} <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/40 px-1.5 py-0.5 rounded ml-1">wechseln</span>
                                  </span>
                                )}
                                {!h.activeBlanketId && (
                                  <span className="text-xs font-bold text-amber-300">
                                    {nightBlanket} <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.5 rounded ml-1">anziehen</span>
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <p className="text-sm text-stone-200">
                      {unblanketEveningHorses.length > 0
                        ? <>Bei <strong>{unblanketEveningHorses.map(h => h.name).join(', ')}</strong> die Tages-Decke abnehmen und ordentlich aufhängen.</>
                        : 'Bei allen anderen Pferden ohne Nacht-Decke die Paddock-Decken abnehmen und ordentlich aufhängen.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm">Bitte alle Paddock-Decken bei den Pferden abnehmen und ordentlich aufhängen.</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
              <h2 className="font-extrabold text-black mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-emerald-700" /> Schwarzes Brett</h2>
              <form onSubmit={handlePostMessage} className="flex gap-2 mb-4">
                <input type="text" required value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Kurze Nachricht an alle..." className="flex-1 bg-white text-black border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                <button type="submit" className="bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl hover:bg-emerald-800 transition-colors"><Send className="w-4 h-4" /></button>
              </form>
              <div className="space-y-3">
                {sortedMessages.map(m => (
                  <div key={m.id} className="bg-stone-50 border border-gray-300 p-3 rounded-xl shadow-sm">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold text-emerald-800">{m.author}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-stone-500">{new Date(m.createdAt).toLocaleDateString('de-DE')}</span>
                        <button onClick={() => deleteMessage(m.id)} className="text-rose-600 hover:text-rose-800 p-0.5" title="Nachricht löschen">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-black">{m.text}</p>
                  </div>
                ))}
                {sortedMessages.length === 0 && <p className="text-sm text-stone-500 italic">Noch keine Nachrichten am Brett.</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PFERDE */}
        {activeTab === 'pferde' && (
          <div className="space-y-4">
            
            {/* List View */}
            {!isEditingHorse && !selectedHorse && (
              <>
                <button onClick={() => {
                  setHorseFormData({ name: '', feed: '', notes: '', image: '', vet: '', vetPhone: '', farrier: '', farrierPhone: '', activeBlanketId: null, nightBlanketId: null, blankets: [{ id: Date.now().toString(), name: 'Regendecke', description: '' }], team: [{ id: Date.now().toString(), name: currentUser.name, role: 'Besitzer', phone: '' }] });
                  setIsEditingHorse(true);
                }} className="w-full bg-emerald-700 hover:bg-emerald-800 transition-colors text-white font-bold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Neues Pferd anlegen
                </button>
                
                <div className="grid grid-cols-1 gap-3">
                  {sortedHorses.map(h => {
                    const nightId = getNightBlanketId(h);
                    return (
                      <div key={h.id} className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-emerald-500 transition-colors" onClick={() => setSelectedHorse(h)}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            {h.image ? (
                              <img src={h.image} alt={h.name} className="w-12 h-12 rounded-full object-cover border-2 border-stone-200" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center border-2 border-stone-300 text-stone-400"><Camera className="w-5 h-5"/></div>
                            )}
                            <h3 className="font-extrabold text-lg text-black">{h.name}</h3>
                          </div>
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-bold">Akte ansehen →</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-2.5" onClick={e => e.stopPropagation()}>
                          {/* DROPDOWN 1: Decke tagsüber */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Decke tagsüber (Morgendienst):</label>
                            {canEditHorse(h) ? (
                              <select value={h.activeBlanketId || ''} onChange={e => toggleBlanket(h.id, e.target.value)} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold">
                                <option value="">🚫 Keine Decke anziehen</option>
                                {(h.blankets || []).map(b => (
                                  <option key={b.id} value={b.id}>🧥 {b.name} {b.description && `(${b.description})`}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="w-full bg-stone-100 text-stone-700 border border-gray-300 text-sm rounded-xl px-3 py-2 font-bold flex items-center gap-2">
                                {h.activeBlanketId ? `🧥 ${(h.blankets || []).find(b=>b.id === h.activeBlanketId)?.name}` : '🚫 Keine Decke'}
                              </div>
                            )}
                          </div>

                          {/* DROPDOWN 2: Decke nachts */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-indigo-800 flex items-center gap-1 mb-1">
                              <Moon className="w-3 h-3"/> Decke nachts (Abenddienst):
                            </label>
                            {canEditHorse(h) ? (
                              <select
                                value={nightId || ''}
                                onChange={e => toggleNightBlanket(h.id, e.target.value)}
                                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-colors ${
                                  nightId
                                    ? 'bg-indigo-50 text-indigo-950 border-indigo-300'
                                    : 'bg-white text-black border-gray-300'
                                }`}
                              >
                                <option value="">🚫 Keine Decke (abends abnehmen)</option>
                                {(h.blankets || []).map(b => (
                                  <option key={b.id} value={b.id}>🌙 {b.name} {b.description && `(${b.description})`}</option>
                                ))}
                              </select>
                            ) : (
                              <div className={`w-full border text-sm rounded-xl px-3 py-2 font-bold flex items-center gap-2 ${
                                nightId
                                  ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                  : 'bg-stone-100 text-stone-700 border-gray-300'
                              }`}>
                                {nightId ? `🌙 ${(h.blankets || []).find(b=>b.id === nightId)?.name}` : '🚫 Keine Decke (abends abnehmen)'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {sortedHorses.length === 0 && <p className="text-center text-stone-500 mt-4">Noch keine Pferde in der Kartei.</p>}
                </div>
              </>
            )}

            {/* Detail View */}
            {selectedHorse && !isEditingHorse && (
              <div className="space-y-4">
                <button onClick={() => setSelectedHorse(null)} className="text-emerald-700 font-bold text-sm flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-300 shadow-sm hover:bg-stone-50">← Zurück zur Übersicht</button>
                <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm overflow-hidden relative">
                  
                  {selectedHorse.image && (
                     <img src={selectedHorse.image} alt={selectedHorse.name} className="w-full h-48 object-cover rounded-xl mb-4 border border-stone-200 shadow-inner" />
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-black text-black">{selectedHorse.name}</h2>
                    {canEditHorse(selectedHorse) && (
                      <button onClick={() => { setHorseFormData(selectedHorse); setIsEditingHorse(true); }} className="bg-stone-100 border border-gray-300 p-2 rounded-xl text-black hover:bg-stone-200 shadow-sm"><Edit2 className="w-5 h-5"/></button>
                    )}
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
                    <h3 className="text-emerald-900 font-extrabold text-sm mb-3 flex items-center gap-1.5"><Info className="w-4 h-4"/> Tägliche Versorgung</h3>
                    <div className="space-y-2">
                      <div className="bg-white text-black border border-gray-300 p-3 rounded-xl shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Futterration</span>
                        <p className="text-sm font-bold whitespace-pre-wrap">{selectedHorse.feed || 'Nicht hinterlegt'}</p>
                      </div>
                      <div className="bg-white text-black border border-gray-300 p-3 rounded-xl shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Decke tagsüber</span>
                        <p className="text-sm font-bold">
                          {selectedHorse.activeBlanketId
                            ? `🧥 ${(selectedHorse.blankets||[]).find(b=>b.id === selectedHorse.activeBlanketId)?.name}`
                            : '🚫 Keine Decke'}
                        </p>
                      </div>
                      <div className="bg-white text-black border border-gray-300 p-3 rounded-xl shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-1">Decke nachts</span>
                        <p className="text-sm font-bold">
                          {getNightBlanketId(selectedHorse)
                            ? `🌙 ${(selectedHorse.blankets||[]).find(b=>b.id === getNightBlanketId(selectedHorse))?.name}`
                            : '🚫 Keine Decke (abends abnehmen)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm mb-4">
                    <h3 className="text-black font-extrabold text-sm mb-3 flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-600"/> Gesundheit & Betreuung</h3>
                    <div className="space-y-2">
                      <div className="bg-stone-50 p-3 rounded-xl border border-gray-300 flex justify-between items-center shadow-sm">
                        <div><span className="text-[10px] text-stone-500 font-bold block mb-1">Tierarzt</span><span className="text-sm font-bold text-black">{selectedHorse.vet || 'Nicht hinterlegt'}</span></div>
                        {selectedHorse.vetPhone && <a href={`tel:${selectedHorse.vetPhone}`} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg shadow-sm"><Phone className="w-4 h-4"/></a>}
                      </div>
                      <div className="bg-stone-50 p-3 rounded-xl border border-gray-300 flex justify-between items-center shadow-sm">
                        <div><span className="text-[10px] text-stone-500 font-bold block mb-1">Hufschmied</span><span className="text-sm font-bold text-black">{selectedHorse.farrier || 'Nicht hinterlegt'}</span></div>
                        {selectedHorse.farrierPhone && <a href={`tel:${selectedHorse.farrierPhone}`} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg shadow-sm"><Phone className="w-4 h-4"/></a>}
                      </div>
                      {selectedHorse.notes && (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl mt-2 shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-rose-800 block mb-1">Medizinische Hinweise (Allergien etc.)</span>
                          <p className="text-sm text-black font-bold whitespace-pre-wrap">{selectedHorse.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
                    <h3 className="text-black font-extrabold text-sm mb-3 flex items-center gap-1.5"><Users className="w-4 h-4 text-stone-600"/> Team (Berechtigungen)</h3>
                    <div className="space-y-2">
                      {(selectedHorse.team || []).map((t, idx) => (
                        <div key={idx} className="bg-stone-50 p-3 rounded-xl border border-gray-300 shadow-sm flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-700 block mb-1">{t.role}</span>
                            <div className="text-sm text-black font-bold">{t.name}</div>
                          </div>
                          {t.phone && <a href={`tel:${t.phone}`} className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm"><Phone className="w-4 h-4"/></a>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Form View */}
            {isEditingHorse && horseFormData && (
              <form onSubmit={saveHorse} className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                  <h2 className="text-xl font-black text-black">Pferdeakte bearbeiten</h2>
                  <button type="button" onClick={() => { setIsEditingHorse(false); if(!horseFormData.id) setSelectedHorse(null); }} className="text-stone-500 bg-stone-100 p-2 rounded-lg border border-gray-300 hover:bg-stone-200"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-2 block">Profilbild</label>
                    <div className="flex items-center gap-4">
                      {horseFormData.image ? (
                        <img src={horseFormData.image} alt="Vorschau" className="w-16 h-16 rounded-full object-cover border border-gray-300" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-stone-100 border border-gray-300 flex items-center justify-center text-stone-400"><Camera className="w-6 h-6"/></div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">Name des Pferdes *</label>
                    <input type="text" required value={horseFormData.name} onChange={e=>setHorseFormData({...horseFormData, name: e.target.value})} placeholder="Pferdename" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">Tägliche Futterration</label>
                    <textarea value={horseFormData.feed} onChange={e=>setHorseFormData({...horseFormData, feed: e.target.value})} placeholder="Welches Futter bekommt das Pferd?" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[80px]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">Besondere Hinweise (Krankheiten, Allergien)</label>
                    <textarea value={horseFormData.notes} onChange={e=>setHorseFormData({...horseFormData, notes: e.target.value})} placeholder="Wichtige Infos für Vertretungen (z.B. Heu nass machen)..." className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[80px]" />
                  </div>
                  
                  {/* Blankets */}
                  <div className="pt-3 border-t border-gray-200">
                    <h3 className="font-extrabold text-sm mb-3 text-black">Decken-Schrank</h3>
                    {(horseFormData.blankets||[]).map((b, idx) => (
                      <div key={b.id} className="flex flex-col gap-2 mb-4 bg-stone-50 p-3 rounded-xl border border-gray-300 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Decke {idx+1}</span>
                          <button type="button" onClick={()=>setHorseFormData({...horseFormData, blankets: horseFormData.blankets.filter((_,i)=>i!==idx)})} className="text-rose-600 bg-rose-50 p-1 rounded border border-rose-200 hover:bg-rose-100"><X className="w-4 h-4"/></button>
                        </div>
                        <input type="text" value={b.name} onChange={e=>{
                          const newB = [...horseFormData.blankets];
                          newB[idx].name = e.target.value;
                          setHorseFormData({...horseFormData, blankets: newB});
                        }} placeholder="Name der Decke (z.B. Winterdecke)" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                        <input type="text" value={b.description} onChange={e=>{
                          const newB = [...horseFormData.blankets];
                          newB[idx].description = e.target.value;
                          setHorseFormData({...horseFormData, blankets: newB});
                        }} placeholder="Beschreibung (z.B. 200g, blau)" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                      </div>
                    ))}
                    <button type="button" onClick={()=>setHorseFormData({...horseFormData, blankets: [...horseFormData.blankets, {id: Date.now().toString(), name:'', description:''}]})} className="w-full text-sm bg-white text-emerald-800 border border-gray-300 py-2 rounded-xl font-bold hover:bg-stone-50">+ Weitere Decke hinzufügen</button>
                  </div>

                  {/* Health Contacts */}
                  <div className="pt-3 border-t border-gray-200">
                     <h3 className="font-extrabold text-sm mb-3 text-black">Gesundheit Kontakte</h3>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-stone-600 mb-1 block">Tierarzt Name</label>
                          <input type="text" value={horseFormData.vet} onChange={e=>setHorseFormData({...horseFormData, vet: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-stone-600 mb-1 block">Tierarzt Telefon</label>
                          <input type="tel" value={horseFormData.vetPhone} onChange={e=>setHorseFormData({...horseFormData, vetPhone: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-stone-600 mb-1 block">Hufschmied Name</label>
                          <input type="text" value={horseFormData.farrier} onChange={e=>setHorseFormData({...horseFormData, farrier: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-stone-600 mb-1 block">Hufschmied Telefon</label>
                          <input type="tel" value={horseFormData.farrierPhone} onChange={e=>setHorseFormData({...horseFormData, farrierPhone: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                        </div>
                     </div>
                  </div>

                  {/* Team */}
                  <div className="pt-3 border-t border-gray-200">
                    <h3 className="font-extrabold text-sm mb-3 text-black">Team (Berechtigungen)</h3>
                    <p className="text-xs text-stone-500 mb-3">Wichtig: Trage den exakten Namen des App-Nutzers ein, damit er/sie Decken wechseln und bearbeiten darf.</p>
                    {(horseFormData.team||[]).map((t, idx) => (
                      <div key={t.id} className="flex flex-col gap-2 mb-4 bg-stone-50 p-3 rounded-xl border border-gray-300 shadow-sm">
                        <div className="flex justify-between items-center">
                          <select value={t.role} onChange={e=>{
                            const newT = [...horseFormData.team];
                            newT[idx].role = e.target.value;
                            setHorseFormData({...horseFormData, team: newT});
                          }} className="bg-white text-black border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600">
                             <option>Besitzer</option>
                             <option>Reitbeteiligung</option>
                             <option>Pfleger</option>
                          </select>
                          <button type="button" onClick={()=>setHorseFormData({...horseFormData, team: horseFormData.team.filter((_,i)=>i!==idx)})} className="text-rose-600 bg-rose-50 p-1 rounded border border-rose-200 hover:bg-rose-100"><X className="w-4 h-4"/></button>
                        </div>
                        <input type="text" value={t.name} onChange={e=>{
                          const newT = [...horseFormData.team];
                          newT[idx].name = e.target.value;
                          setHorseFormData({...horseFormData, team: newT});
                        }} placeholder="Exakter Name des Nutzers" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                        <input type="tel" value={t.phone} onChange={e=>{
                          const newT = [...horseFormData.team];
                          newT[idx].phone = e.target.value;
                          setHorseFormData({...horseFormData, team: newT});
                        }} placeholder="Handynummer (Optional)" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                      </div>
                    ))}
                    <button type="button" onClick={()=>setHorseFormData({...horseFormData, team: [...horseFormData.team, {id: Date.now().toString(), name:'', role:'Reitbeteiligung', phone:''}]})} className="w-full text-sm bg-white text-emerald-800 border border-gray-300 py-2 rounded-xl font-bold hover:bg-stone-50">+ Person hinzufügen</button>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <button type="submit" disabled={!horseFormData.name} className="w-full bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50 hover:bg-emerald-900 transition-colors">Speichern & Schließen</button>
                    {horseFormData.id && <button type="button" onClick={()=>deleteHorse(horseFormData.id)} className="w-full bg-white text-rose-600 border border-gray-300 font-bold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-stone-50 transition-colors"><Trash2 className="w-5 h-5"/> Akte endgültig löschen</button>}
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB: PLÄNE */}
        {activeTab === 'pläne' && (
          <div className="space-y-4">
            {/* Sub-Tab Switcher */}
            <div className="flex bg-stone-200 p-1.5 rounded-xl shadow-inner border border-gray-300">
              <button onClick={()=>setPlanSubTab('dienste')} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${planSubTab==='dienste' ? 'bg-white border-gray-300 text-emerald-900 shadow-sm' : 'bg-transparent border-transparent text-stone-600 hover:text-black'}`}>Dienstplan</button>
              <button onClick={()=>setPlanSubTab('belegung')} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${planSubTab==='belegung' ? 'bg-white border-gray-300 text-emerald-900 shadow-sm' : 'bg-transparent border-transparent text-stone-600 hover:text-black'}`}>Anlagenbelegung</button>
            </div>

            {/* Sub-Tab: Dienste */}
            {planSubTab === 'dienste' && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {weeksData.map((week, idx) => (
                    <button key={idx} onClick={()=>setSelectedWeek(idx)} className={`py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${selectedWeek === idx ? 'bg-emerald-800 text-white border-emerald-900 shadow-md' : 'bg-white text-black border-gray-300 shadow-sm hover:bg-stone-50'}`}>KW {week.kw}</button>
                  ))}
                </div>
                <div className="space-y-3 mt-3">
                  {weeksData[selectedWeek]?.days.map(day => {
                    const amShifts = shifts.filter(s => s.date === day.iso && s.type === 'am');
                    const pmShifts = shifts.filter(s => s.date === day.iso && s.type === 'pm');
                    
                    const renderSlot = (type, label, max, currentShifts) => {
                      const slots = [];
                      for(let i=0; i<max; i++) {
                        const s = currentShifts[i];
                        if (s) {
                          const matchedHorse = s.horseId
                            ? horses.find(h => h.id === s.horseId)
                            : (s.horseName ? horses.find(h => (h.name || '').trim().toLowerCase() === s.horseName.trim().toLowerCase()) : null);
                          slots.push(
                            <div key={s.id} className="flex justify-between items-center text-xs font-bold p-2 mb-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm">
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                {s.horseName ? (
                                  <>
                                    {matchedHorse?.image ? (
                                      <img src={matchedHorse.image} alt={s.horseName} className="w-7 h-7 rounded-full object-cover border border-emerald-400 shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-emerald-800 text-white text-xs flex items-center justify-center shrink-0">
                                        🐴
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <span className="font-black text-emerald-950 block truncate">{s.horseName}</span>
                                      <span className="text-[10px] font-medium text-emerald-700 block truncate">{s.userName}</span>
                                    </div>
                                  </>
                                ) : (
                                  <span className="truncate block">{s.userName}</span>
                                )}
                              </div>
                              {canRemoveShift(s) && (
                                <button onClick={()=>removeShift(s.id)} className="text-rose-600 bg-white border border-rose-200 rounded px-1.5 py-0.5 hover:bg-rose-100 shrink-0">
                                  <X className="w-3 h-3"/>
                                </button>
                              )}
                            </div>
                          );
                        } else {
                          slots.push(
                            <button key={`empty-${i}`} onClick={()=>handleOpenShiftPicker(day.iso, type, day.label)} className="w-full text-left text-xs font-bold text-emerald-700 bg-white border border-gray-300 p-2 mb-1.5 rounded-lg flex items-center justify-between shadow-sm hover:border-emerald-500 transition-colors">
                              <span>Frei</span><Plus className="w-4 h-4"/>
                            </button>
                          );
                        }
                      }
                      return (
                        <div className="flex-1 bg-stone-100 p-2 rounded-xl border border-gray-300 shadow-inner">
                          <div className="text-[10px] font-bold text-stone-600 uppercase mb-2 tracking-wide text-center">{label}</div>
                          {slots}
                        </div>
                      );
                    };
                    
                    return (
                      <div key={day.iso} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-300">
                        <div className="font-black text-base text-black mb-2 border-b border-gray-200 pb-1">{day.label}</div>
                        <div className="flex gap-2">
                          {renderSlot('am', 'Morgens (1)', 1, amShifts)}
                          {renderSlot('pm', 'Abends (3)', 3, pmShifts)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Sub-Tab: Belegung */}
            {planSubTab === 'belegung' && (
              <div className="space-y-4">
                <form onSubmit={submitBooking} className="bg-white p-4 rounded-2xl border border-gray-300 shadow-sm space-y-4">
                  <h3 className="font-black text-base text-black border-b border-gray-200 pb-2">Neue Reservierung</h3>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">Anlage auswählen</label>
                    <select value={newBooking.type} onChange={e=>setNewBooking({...newBooking, type: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold">
                      <option>Reitplatz</option>
                      <option>Krankenpaddock</option>
                    </select>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-stone-600 mb-1 block">Datum</label>
                     <input type="date" required value={newBooking.date} onChange={e=>setNewBooking({...newBooking, date: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-stone-600 mb-1 block">Von Uhrzeit</label>
                      <input type="time" required value={newBooking.startTime} onChange={e=>setNewBooking({...newBooking, startTime: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-stone-600 mb-1 block">Bis Uhrzeit</label>
                      <input type="time" required value={newBooking.endTime} onChange={e=>setNewBooking({...newBooking, endTime: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md mt-2 hover:bg-emerald-900 transition-colors">Jetzt Buchen</button>
                </form>

                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-stone-600 pl-1">Aktuelle Belegungen</h3>
                  {[...bookings].sort((a,b) => a.date.localeCompare(b.date)).map(b => (
                    <div key={b.id} className="bg-white p-4 rounded-xl border border-gray-300 shadow-sm text-sm flex flex-col gap-1">
                      <div className="font-black text-emerald-900 text-base">{b.type}</div>
                      <div className="text-black font-bold flex items-center gap-2">
                        <span>📅 {new Date(b.date).toLocaleDateString('de-DE')}</span>
                        <span>⏰ {b.startTime} - {b.endTime} Uhr</span>
                      </div>
                      <div className="text-stone-500 text-xs mt-1">Gebucht von: {b.userName}</div>
                    </div>
                  ))}
                  {bookings.length === 0 && <p className="text-stone-500 text-sm">Derzeit keine Anlagen gebucht.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: MEHR */}
        {activeTab === 'mehr' && (
          <div className="space-y-5">
            
            {/* Passwort ändern */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
              <h2 className="font-black text-emerald-900 text-lg mb-4 flex items-center gap-2 border-b border-emerald-100 pb-2"><ShieldCheck className="w-5 h-5"/> Mein Passwort ändern</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-stone-600 mb-1 block">Neues Passwort festlegen</label>
                   <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors">Passwort speichern</button>
              </form>
              <p className="text-xs text-stone-500 mt-3">Nach dem Speichern ist dein neues Passwort direkt in der Datenbank gesichert und nicht mehr sichtbar.</p>
            </section>

            {/* Formular: Vertretung */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
              <h2 className="font-black text-amber-900 text-lg mb-4 flex items-center gap-2 border-b border-amber-100 pb-2">Vertretung gesucht</h2>
              <form onSubmit={submitRequest} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-600 mb-1 block">Welche Aufgabe?</label>
                  <select value={newRequest.task} onChange={e=>setNewRequest({...newRequest, task: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 font-bold">
                    <option>Misten</option>
                    <option>Morgendienst</option>
                    <option>Abenddienst</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-stone-600 mb-1 block">Von Datum</label>
                    <input type="date" required value={newRequest.startDate} onChange={e=>setNewRequest({...newRequest, startDate: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-stone-600 mb-1 block">Bis Datum</label>
                    <input type="date" required value={newRequest.endDate} onChange={e=>setNewRequest({...newRequest, endDate: e.target.value})} className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
                  </div>
                </div>
                <div>
                   <label className="text-xs font-bold text-stone-600 mb-1 block">Notizen (z.B. Für welches Pferd?)</label>
                   <input type="text" value={newRequest.note} onChange={e=>setNewRequest({...newRequest, note: e.target.value})} placeholder="Kurze Info..." className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
                </div>
                <button type="submit" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors">Gesuch eintragen</button>
              </form>
            </section>

            {/* Formular: Mängel */}
            <section className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
              <h2 className="font-black text-rose-900 text-lg mb-4 flex items-center gap-2 border-b border-rose-100 pb-2"><AlertTriangle className="w-5 h-5"/> Schaden / Mangel melden</h2>
              <form onSubmit={submitDamage} className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-stone-600 mb-1 block">Ort des Schadens</label>
                   <input type="text" required value={newDamage.location} onChange={e=>setNewDamage({...newDamage, location: e.target.value})} placeholder="z.B. Paddock 3, Reitplatzzaun" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-600" />
                </div>
                <div>
                   <label className="text-xs font-bold text-stone-600 mb-1 block">Genaue Beschreibung</label>
                   <textarea required value={newDamage.description} onChange={e=>setNewDamage({...newDamage, description: e.target.value})} placeholder="Was ist kaputt? Benötigt man Werkzeug?" className="w-full bg-white text-black border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-600 min-h-[100px]" />
                </div>
                <button type="submit" className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors">Mangel eintragen</button>
              </form>
            </section>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 w-full max-w-2xl bg-white border-t border-gray-300 flex justify-around items-center pb-safe pt-2 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${activeTab === 'home' ? 'text-emerald-800 bg-emerald-100 font-bold' : 'text-stone-500 hover:text-emerald-700'}`}>
          <Home className={`w-6 h-6 mb-1 ${activeTab === 'home' ? 'stroke-2' : 'stroke-[1.5]'}`} />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => setActiveTab('pferde')} className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${activeTab === 'pferde' ? 'text-emerald-800 bg-emerald-100 font-bold' : 'text-stone-500 hover:text-emerald-700'}`}>
          <ClipboardList className={`w-6 h-6 mb-1 ${activeTab === 'pferde' ? 'stroke-2' : 'stroke-[1.5]'}`} />
          <span className="text-[10px]">Pferde</span>
        </button>
        <button onClick={() => setActiveTab('pläne')} className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${activeTab === 'pläne' ? 'text-emerald-800 bg-emerald-100 font-bold' : 'text-stone-500 hover:text-emerald-700'}`}>
          <CalendarDays className={`w-6 h-6 mb-1 ${activeTab === 'pläne' ? 'stroke-2' : 'stroke-[1.5]'}`} />
          <span className="text-[10px]">Pläne</span>
        </button>
        <button onClick={() => setActiveTab('mehr')} className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] relative transition-colors ${activeTab === 'mehr' ? 'text-emerald-800 bg-emerald-100 font-bold' : 'text-stone-500 hover:text-emerald-700'}`}>
          <MoreHorizontal className={`w-6 h-6 mb-1 ${activeTab === 'mehr' ? 'stroke-2' : 'stroke-[1.5]'}`} />
          <span className="text-[10px]">Mehr</span>
          {hasNotifications && <span className="absolute top-2 right-4 w-3 h-3 bg-rose-600 rounded-full border-2 border-white shadow-sm"></span>}
        </button>
      </nav>
      <div className="h-20" /> {/* Spacer */}
    </div>
  );
}
