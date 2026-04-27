'use client';
import { useState, useEffect } from 'react';
import { Home, Gamepad2, User, Wallet, ArrowDownToLine, ArrowUpFromLine, LogOut, Info, Loader2, X, MessageSquareWarning } from 'lucide-react';
import { supabase } from './supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [isInitializing, setIsInitializing] = useState(true);

  // FIX: STAY LOGGED IN ON REFRESH
  useEffect(() => {
    const savedUser = localStorage.getItem('123bet_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsInitializing(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('123bet_session');
    setCurrentUser(null);
  };

  if (isInitializing) return <div className="app-container" style={{justifyContent: 'center'}}><Loader2 className="animate-spin text-blue-500" size={50}/></div>;

  return (
    <div className="app-container">
      {!currentUser ? (
        <LoginScreen setCurrentUser={setCurrentUser} />
      ) : (
        <>
          {activeTab === 'home' && <LandingView setActiveTab={setActiveTab} />}
          {activeTab === 'play' && <GameEngine currentUser={currentUser} setCurrentUser={setCurrentUser} />}
          {activeTab === 'profile' && <ProfileView currentUser={currentUser} onLogout={handleLogout} />}
          
          <nav className="bottom-nav">
            <div className="nav-items">
              <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                <Home size={24} style={{marginBottom: '4px'}} /> Home
              </button>
              <button className="nav-play-btn" onClick={() => setActiveTab('play')}>
                <Gamepad2 size={28} />
              </button>
              <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <User size={24} style={{marginBottom: '4px'}} /> Profile
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

function GameEngine({ currentUser, setCurrentUser }) {
  const [gameState, setGameState] = useState('lobby'); 
  const [timer, setTimer] = useState(10);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [result, setResult] = useState(null);
  
  const [matchId, setMatchId] = useState(null);
  const [myRole, setMyRole] = useState(null); 
  const [oppChoice, setOppChoice] = useState(null);
  
  // FIX: PREVENT DOUBLE PAYOUTS
  const [hasEvaluated, setHasEvaluated] = useState(false); 

  const changeBalance = async (amount) => {
    try {
      await supabase.rpc('process_transaction', { target_user_id: currentUser.id, amount: amount });
      
      const newBalance = currentUser.balance + amount;
      const updatedUser = { ...currentUser, balance: newBalance };
      setCurrentUser(updatedUser);
      localStorage.setItem('123bet_session', JSON.stringify(updatedUser)); // Keep storage synced
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  };

  useEffect(() => {
    let interval;
    if (gameState === 'playing' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (gameState === 'playing' && timer === 0) {
      submitChoice(selectedNumber); 
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const findMatch = async () => {
    if (currentUser.balance < 1000) return alert("Insufficient funds.");
    
    await changeBalance(-1000); 
    setGameState('searching');
    setSelectedNumber(null);
    setOppChoice(null);
    setHasEvaluated(false); // Reset the lock

    try {
      const { data: waitingMatch, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'waiting')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let currentMatchId;

      if (waitingMatch) {
        const { data: updatedMatch, error: updateError } = await supabase
          .from('matches')
          .update({ player2_id: currentUser.id, status: 'playing' })
          .eq('id', waitingMatch.id)
          .select().single();
        
        if (updateError) throw updateError;

        currentMatchId = updatedMatch.id;
        setMyRole('player2');
        setGameState('playing');
        setTimer(10);
      } else {
        const { data: newMatch, error: insertError } = await supabase
          .from('matches')
          .insert([{ player1_id: currentUser.id, status: 'waiting' }])
          .select().single();
        
        if (insertError) throw insertError;

        currentMatchId = newMatch.id;
        setMyRole('player1');
      }

      setMatchId(currentMatchId);

      // FIX: STRICTER REALTIME SYNC
      supabase.channel(`match_${currentMatchId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${currentMatchId}` }, (payload) => {
          const updatedMatch = payload.new;
          
          // Only start if we are 100% sure Player 2 is here
          if (updatedMatch.status === 'playing' && updatedMatch.player2_id) {
            setGameState(prev => {
               if (prev === 'searching') {
                 setTimer(10);
                 return 'playing';
               }
               return prev;
            });
          }

          // Both players made choices, evaluate carefully
          if (updatedMatch.player1_choice !== null && updatedMatch.player2_choice !== null) {
             evaluateWinner(updatedMatch);
          }
        }).subscribe();

    } catch (err) {
      alert("Matchmaking Error: " + err.message);
      setGameState('lobby');
      await changeBalance(1000); 
    }
  };

  const submitChoice = async (choice) => {
    // FIX: Fallback to 0 if they don't pick
    const finalChoice = choice || 0; 
    try {
      const updatePayload = myRole === 'player1' ? { player1_choice: finalChoice } : { player2_choice: finalChoice };
      await supabase.from('matches').update(updatePayload).eq('id', matchId);
    } catch (err) {
      console.error(err);
    }
  };

  const evaluateWinner = async (matchData) => {
    if (hasEvaluated) return; // THE LOCK: Stops multiple payouts
    setHasEvaluated(true);

    // Read the exact data from the database payload, not local state
    const myMove = myRole === 'player1' ? matchData.player1_choice : matchData.player2_choice;
    const oppMove = myRole === 'player1' ? matchData.player2_choice : matchData.player1_choice;
    
    setOppChoice(oppMove === 0 ? 'X' : oppMove); 

    if (myMove === 0 && oppMove === 0) {
      setResult('TIE (BOTH TIMEOUT)');
      await changeBalance(1000); 
    } else if (myMove === 0) {
      setResult('TIMEOUT LOSS');
    } else if (oppMove === 0) {
      setResult('WIN (OPP TIMEOUT)');
      await changeBalance(1800);
    } else if (myMove === oppMove) {
      setResult('TIE');
      await changeBalance(1000); // FIX: Explicit Tie functionality
    } else if (
      (myMove === 1 && oppMove === 3) ||
      (myMove === 2 && oppMove === 1) ||
      (myMove === 3 && oppMove === 2)
    ) {
      setResult('WIN');
      await changeBalance(1800); 
    } else {
      setResult('LOSS');
    }
    setGameState('result');
    
    // Clean up channel so it doesn't double-fire later
    supabase.removeChannel(supabase.channel(`match_${matchData.id}`));
  };

  return (
    <div className="screen">
      <div className="header-bar">
        <span style={{color: '#94a3b8'}}>Wallet</span>
        <span className="balance-text">TZS {currentUser.balance.toLocaleString()}</span>
      </div>

      {gameState === 'lobby' && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px'}}>
          <div style={{background: 'rgba(59, 130, 246, 0.1)', padding: '30px', borderRadius: '50%', marginBottom: '20px'}}>
             <Gamepad2 size={60} color="#60a5fa" />
          </div>
          <h2>Find Opponent</h2>
          <p style={{color: '#94a3b8', marginBottom: '30px'}}>Stake: TZS 1,000 | Win: TZS 1,800</p>
          <button className="btn-success" onClick={findMatch}>FIND MATCH</button>
        </div>
      )}

      {gameState === 'searching' && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px'}}>
           <Loader2 className="animate-spin" size={60} color="#60a5fa" style={{marginBottom: '20px'}} />
           <h2>Searching for Opponent...</h2>
        </div>
      )}

      {gameState === 'playing' && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div className="timer-bar">
             <div className="timer-fill" style={{ width: `${(timer / 10) * 100}%` }}></div>
          </div>
          <div className="timer-text">{timer}</div>
          <div className="game-grid">
            {[1, 2, 3].map((num) => (
              <button key={num} onClick={() => setSelectedNumber(num)} className={`btn-number ${selectedNumber === num ? 'selected' : ''}`}>
                {num}
              </button>
            ))}
          </div>
          {selectedNumber && (
            <button className="btn-primary" onClick={() => submitChoice(selectedNumber)}>LOCK IN BET</button>
          )}
        </div>
      )}

      {gameState === 'result' && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <h2 className={`result-text ${result.includes('WIN') ? 'win' : result.includes('TIE') ? 'tie' : 'loss'}`} style={{fontSize: '2.5rem', textAlign: 'center'}}>{result}</h2>
          <div className="versus-row">
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <span style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '10px'}}>YOU</span>
              <div className="player-box">{selectedNumber || 'X'}</div>
            </div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#475569', fontStyle: 'italic'}}>VS</div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <span style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '10px'}}>OPPONENT</span>
              <div className="player-box" style={{borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444'}}>{oppChoice}</div>
            </div>
          </div>
          <button className="btn-outline" onClick={() => setGameState('lobby')}>PLAY AGAIN</button>
        </div>
      )}
    </div>
  );
}

function LandingView({ setActiveTab }) {
  return (
    <div className="screen">
      <h1 className="title">123 BET</h1>
      <p className="subtitle">Fastest PvP in Tanzania</p>
      <div className="card"><h2 style={{ display: 'flex', alignItems: 'center', color: '#cffafe', marginBottom: '15px' }}><Info size={20} style={{ marginRight: '8px', color: '#38bdf8' }}/> How to Play</h2><p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}><strong>1.</strong> Match against a real player. Stake TZS 1,000.<br/><strong>2.</strong> You have 10 seconds to choose 1, 2, or 3.<br/><strong>3.</strong> The winner takes the pot instantly!</p></div>
      <div className="card" style={{ background: 'rgba(49, 46, 129, 0.4)', borderColor: 'rgba(99, 102, 241, 0.3)' }}><h2 style={{ textAlign: 'center', color: '#e0e7ff', marginBottom: '20px' }}>Rules of Combat</h2><div className="rule-row"><div className="rule-box winner">1</div><span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold'}}>BEATS</span><div className="rule-box">3</div></div><div className="rule-row"><div className="rule-box winner">2</div><span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold'}}>BEATS</span><div className="rule-box">1</div></div><div className="rule-row"><div className="rule-box winner">3</div><span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold'}}>BEATS</span><div className="rule-box">2</div></div></div>
      <button className="btn-primary" onClick={() => setActiveTab('play')}>ENTER ARENA NOW</button>
    </div>
  );
}

function ProfileView({ currentUser, onLogout }) {
  // Simplified for brevity, kept exactly the same UI as Phase 4
  return (
    <div className="screen">
      <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: '30px'}}>
        <div style={{width: '60px', height: '60px', borderRadius: '30px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', marginRight: '15px'}}>
          {currentUser.phone.substring(0,2)}
        </div>
        <div style={{textAlign: 'left'}}>
          <h2 style={{marginBottom: '2px'}}>Player</h2>
          <p style={{color: '#94a3b8', fontSize: '0.9rem', margin: 0}}>{currentUser.phone}</p>
        </div>
      </div>
      
      <div className="card" style={{textAlign: 'center', padding: '30px 20px'}}>
        <p style={{color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Available Balance</p>
        <h3 style={{fontSize: '2.5rem', fontFamily: 'monospace', margin: '15px 0 25px 0'}}>TZS {currentUser.balance.toLocaleString()}</h3>
      </div>

      <button className="btn-outline" onClick={onLogout} style={{borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <LogOut size={20} style={{marginRight: '10px'}}/> LOGOUT
      </button>
    </div>
  );
}

function LoginScreen({ setCurrentUser }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // login or forgot

  const handleAuth = async () => {
    if (!phone || !pin) return alert("Please enter both Phone and PIN");
    setLoading(true);
    
    try {
      const { data: user, error: fetchError } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle();
      
      if (user) {
        if (user.pin !== pin) throw new Error("Incorrect PIN");
        setCurrentUser(user);
        localStorage.setItem('123bet_session', JSON.stringify(user)); // Save session
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ phone, pin, balance: 5000 }])
          .select().single();
          
        if (insertError) throw insertError;
        alert("Account Created! You've been given a TZS 5,000 testing balance.");
        setCurrentUser(newUser);
        localStorage.setItem('123bet_session', JSON.stringify(newUser)); // Save session
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // FEATURE: PASSWORD RECOVERY SIMULATION
  const handleRecovery = async () => {
    if (!phone || !pin) return alert("Enter Phone and your NEW PIN");
    setLoading(true);
    
    setTimeout(async () => {
      try {
        const { data: user } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle();
        if (!user) throw new Error("Phone number not found in database.");

        await supabase.from('users').update({ pin: pin }).eq('phone', phone);
        alert("SMS OTP Simulated. PIN successfully reset!");
        setMode('login');
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }, 2000); // Simulate SMS send delay
  };

  if (mode === 'forgot') {
    return (
      <div className="screen" style={{justifyContent: 'center', paddingTop: '10vh'}}>
        <MessageSquareWarning size={50} color="#3b82f6" style={{marginBottom: '20px'}} />
        <h1 className="title" style={{fontSize: '2.5rem'}}>Reset PIN</h1>
        <p style={{color: '#94a3b8', marginBottom: '30px'}}>Enter your number and a new PIN.</p>
        
        <input type="text" placeholder="Your Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="Create NEW 4-Digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
        
        <button className="btn-primary" onClick={handleRecovery} style={{marginTop: '20px', background: 'var(--success-gradient)'}}>
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "RESET VIA SMS"}
        </button>
        <button className="btn-outline" onClick={() => setMode('login')} style={{border: 'none'}}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="screen" style={{justifyContent: 'center', paddingTop: '10vh'}}>
      <div style={{width: '90px', height: '90px', background: 'var(--primary-gradient)', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)', marginBottom: '30px', boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'}}><Gamepad2 size={45} color="white" style={{transform: 'rotate(-12deg)'}} /></div>
      <h1 className="title" style={{fontSize: '3.5rem'}}>123 BET</h1><p style={{color: '#94a3b8', marginBottom: '40px'}}>Login to enter the arena.</p>
      
      <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input type="password" placeholder="4-Digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
      
      <button className="btn-primary" onClick={handleAuth} style={{marginTop: '10px'}}>
        {loading ? <Loader2 className="animate-spin mx-auto" /> : "SECURE LOGIN"}
      </button>

      <button className="btn-outline" onClick={() => setMode('forgot')} style={{border: 'none', marginTop: '10px', color: '#60a5fa'}}>
        Forgot PIN?
      </button>
    </div>
  );
}
