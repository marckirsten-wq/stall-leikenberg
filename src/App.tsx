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
  Camera
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, setDoc, deleteDoc } from 'firebase/firestore';

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
const getNext21Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      iso: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    });
  }
  return dates;
};

export default function StallApp() {
  // Auth State
  const [fbUser, setFbUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  
  // Data State (Optimistic UI)
  const [profiles, setProfiles] = useState([]); // Removed DEMO_USERS
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
  
  // --- Form States ---
  const [newMessage, setNewMessage] = useState('');
  const [newBooking, setNewBooking] = useState({ type: 'Reitplatz', date: '', startTime: '', endTime: '', note: '' });
  const [newRequest, setNewRequest] = useState({ task: 'Misten', startDate: '', endDate: '', note: '' });
  const [newDamage, setNewDamage] = useState({ location: '', description: '' });

  // Horse Form State
  const [isEditingHorse, setIsEditingHorse] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [horseFormData, setHorseFormData] = useState({
    name: '', feed: '', notes: '', image: '', vet: '', vetPhone: '', farrier: '', farrierPhone: '',
    activeBlanketId: null, blankets: [], team: []
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
            console.warn("Custom token failed (expected with custom Firebase config). Falling back to anonymous auth.", customTokenError);
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
        if (!snapshot.empty) {
          setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
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
      showToast(`Willkommen zurück, ${user.name}!`);
    } else {
      setAuthError('E-Mail oder Passwort falsch.');
    }
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
    
    // --- ADMIN CHECK LOGIC ---
    // If the registered email matches the provided admin email, set role to 'admin', else 'user'
    const role = newUserEmail === 'kirstenmarc@outlook.de' ? 'admin' : 'user';
    
    const newUser = { 
      id: newId, 
      email: loginForm.email, 
      password: loginForm.password, 
      name: loginForm.name, 
      role: role, 
      createdAt: new Date().toISOString() 
    };
    
    // Optimistic Update
    setProfiles(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    
    if (role === 'admin') {
      showToast('Admin-Konto erfolgreich erstellt!');
    } else {
      showToast('Registrierung erfolgreich!');
    }
    
    // Firebase Sync
    await syncToFirebase('profiles', newId, newUser);
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
      activeBlanketId: horseFormData.activeBlanketId || null,
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
    setHorses(prev => prev.map(h => h.id === horseId ? { ...h, activeBlanketId: newVal } : h));
    showToast('Decke aktualisiert!');
    await syncToFirebase('horses', horseId, { activeBlanketId: newVal });
  };

  const addShift = async (date, type) => {
    const newId = Date.now().toString();
    const shiftData = { id: newId, date, type, userId: currentUser.id, userName: currentUser.name };
    setShifts(prev => [...prev, shiftData]);
    showToast('Erfolgreich eingetragen!');
    await syncToFirebase('shifts', newId, shiftData);
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
  const blanketHorses = sortedHorses.filter(h => h.activeBlanketId);

  // --- RENDER LOGIN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans text-black">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border border-stone-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-emerald-900 mb-1">Stallgemeinschaft</h1>
            <h2 className="text-xl font-bold text-amber-700 uppercase tracking-widest">Leikenberg</h2>
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

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-emerald-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <span className="font-black text-sm block tracking-wide">Stallgemeinschaft Leikenberg</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
            {currentUser.role === 'admin' ? <ShieldCheck className="w-3 h-3"/> : <User className="w-3 h-3"/>}
            {currentUser.name}
          </span>
          <button onClick={() => setCurrentUser(null)} className="text-[10px] text-emerald-200 hover:text-white mt-1 font-bold underline">Logout</button>
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
              <div className="bg-emerald-800 text-white border border-emerald-900 rounded-2xl p-4 shadow-md">
                <h3 className="font-extrabold flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5"/> Morgendienst (Decken AN)</h3>
                {blanketHorses.length === 0 ? <p className="text-sm">Aktuell keine Decken nötig.</p> : (
                  <ul className="space-y-2 mt-3">
                    {blanketHorses.map(h => (
                      <li key={h.id} className="flex items-center gap-2 bg-emerald-900 p-2 rounded-xl border border-emerald-700">
                        <span className="text-sm font-bold flex-1">{h.name}</span>
                        <span className="text-xs text-amber-300 font-bold">{(h.blankets||[]).find(b=>b.id === h.activeBlanketId)?.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-stone-800 text-white border border-stone-900 rounded-2xl p-4 shadow-md">
                <h3 className="font-extrabold flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5"/> Abenddienst (Decken AUS)</h3>
                <p className="text-sm">Bitte alle Paddock-Decken bei den Pferden abnehmen und ordentlich aufhängen.</p>
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
                      <span className="text-[10px] text-stone-500">{new Date(m.createdAt).toLocaleDateString('de-DE')}</span>
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
                  setHorseFormData({ name: '', feed: '', notes: '', image: '', vet: '', vetPhone: '', farrier: '', farrierPhone: '', activeBlanketId: null, blankets: [{ id: Date.now().toString(), name: 'Regendecke', description: '' }], team: [{ id: Date.now().toString(), name: currentUser.name, role: 'Besitzer', phone: '' }] });
                  setIsEditingHorse(true);
                }} className="w-full bg-emerald-700 hover:bg-emerald-800 transition-colors text-white font-bold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Neues Pferd anlegen
                </button>
                
                <div className="grid grid-cols-1 gap-3">
                  {sortedHorses.map(h => (
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
                      <div className="mt-2 pt-2 border-t border-gray-200" onClick={e => e.stopPropagation()}>
                        <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Decke für heute:</label>
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
                    </div>
                  ))}
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
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Aktuelle Decke</span>
                        <p className="text-sm font-bold">{selectedHorse.activeBlanketId ? (selectedHorse.blankets||[]).find(b=>b.id === selectedHorse.activeBlanketId)?.name : '🚫 Keine Decke'}</p>
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
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map(w => (
                    <button key={w} onClick={()=>setSelectedWeek(w)} className={`py-2 rounded-xl text-sm font-bold border transition-colors ${selectedWeek === w ? 'bg-emerald-800 text-white border-emerald-900 shadow-md' : 'bg-white text-black border-gray-300 shadow-sm hover:bg-stone-50'}`}>Woche {w+1}</button>
                  ))}
                </div>
                <div className="space-y-3">
                  {getNext21Days().slice(selectedWeek * 7, (selectedWeek + 1) * 7).map(day => {
                    const amShifts = shifts.filter(s => s.date === day.iso && s.type === 'am');
                    const pmShifts = shifts.filter(s => s.date === day.iso && s.type === 'pm');
                    
                    const renderSlot = (type, label, max, currentShifts) => {
                      const slots = [];
                      for(let i=0; i<max; i++) {
                        const s = currentShifts[i];
                        if (s) {
                          slots.push(
                            <div key={s.id} className="flex justify-between items-center text-xs font-bold p-2 mb-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm">
                              <span>{s.userName}</span>
                              {s.userId === currentUser.id && <button onClick={()=>removeShift(s.id)} className="text-rose-600 bg-white border border-rose-200 rounded px-1.5 py-0.5 hover:bg-rose-100"><X className="w-3 h-3"/></button>}
                            </div>
                          );
                        } else {
                          slots.push(
                            <button key={`empty-${i}`} onClick={()=>addShift(day.iso, type)} className="w-full text-left text-xs font-bold text-emerald-700 bg-white border border-gray-300 p-2 mb-1.5 rounded-lg flex items-center justify-between shadow-sm hover:border-emerald-500 transition-colors">
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