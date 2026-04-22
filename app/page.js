'use client';
import { useState, useEffect } from 'react';
import { Home, Gamepad2, User, Wallet, ArrowDownToLine, ArrowUpFromLine, LogOut, Info, Loader2, X } from 'lucide-react';
import { supabase } from './supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [currentUser, setCurrentUser] = useState(null); 

  return (
    <div className="app-container">
      {!currentUser ? (
        <LoginScreen setCurrentUser={setCurrentUser} />
      ) : (
        <>
          {activeTab === 'home' && <LandingView setActiveTab={setActiveTab} />}
          {activeTab === 'play' && <GameEngine currentUser={currentUser} setCurrentUser={setCurrentUser} />}
          {activeTab === 'profile' && <ProfileView currentUser={currentUser} setCurrentUser={setCurrentUser} />}
          
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

  const changeBalance = async (amount) => {
    const newBalance = currentUser.balance + amount;
    await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);
    setCurrentUser(prev => ({ ...prev, balance: newBalance }));
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
    if (currentUser.balance < 1000) return alert("Insufficient funds. Go to Profile to deposit.");
    
    await changeBalance(-1000); 
    setGameState('searching');
    setSelectedNumber(null);
    setOppChoice(null);

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

      supabase.channel(`match_${currentMatchId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${currentMatchId}` }, (payload) => {
          const updatedMatch = payload.new;
          
          if (updatedMatch.status === 'playing') {
            setGameState(prev => {
               if (prev !== 'playing') {
                 setTimer(10);
                 return 'playing';
               }
               return prev;
            });
          }

          if (updatedMatch.player1_choice && updatedMatch.player2_choice) {
            evaluateWinner(updatedMatch);
          }
        }).subscribe();

    } catch (err) {
      alert("System Failed: " + err.message);
      setGameState('lobby');
      await changeBalance(1000); 
    }
  };

  const submitChoice = async (choice) => {
    if (!choice && timer > 0) return; 
    try {
      const updatePayload = myRole === 'player1' ? { player1_choice: choice || 0 } : { player2_choice: choice || 0 };
      await supabase.from('matches').update(updatePayload).eq('id', matchId);
    } catch (err) {
      alert("Submission Error: " + err.message);
    }
  };

  const evaluateWinner = async (matchData) => {
    const myMove = myRole === 'player1' ? matchData.player1_choice : matchData.player2_choice;
    const oppMove = myRole === 'player1' ? matchData.player2_choice : matchData.player1_choice;
    
    setOppChoice(oppMove === 0 ? 'X' : oppMove); 

    if (myMove === 0) {
      setResult('TIMEOUT LOSS');
    } else if (oppMove === 0) {
      setResult('WIN (OPP TIMEOUT)');
      await changeBalance(1800);
    } else if (myMove === oppMove) {
      setResult('TIE');
      await changeBalance(1000); 
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
  };

  return (
    <div className="screen">
      <div className="header-bar">
        <span style={{color: '#94a3b8'}}>Wallet Balance</span>
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
           <p style={{color: '#94a3b8'}}>Waiting for another player to join Tier 1.</p>
        </div>
      )}

      {gameState === 'playing' && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div className="timer-bar">
             <div className="timer-fill" style={{ width: `${(timer / 10) * 100}%` }}></div>
          </div>
          <div className="timer-text">{timer}</div>
          <p style={{color: '#94a3b8', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '20px'}}>MAKE YOUR CHOICE</p>
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
          <h2 className={`result-text ${result.includes('WIN') ? 'win' : result === 'TIE' ? 'tie' : 'loss'}`} style={{fontSize: '3rem'}}>{result}</h2>
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

function ProfileView({ currentUser, setCurrentUser }) {
  const [showModal, setShowModal] = useState(null); // 'deposit' or 'withdraw'
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransaction = async () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 1000) return alert("Minimum amount is TZS 1,000");
    if (showModal === 'withdraw' && numAmount > currentUser.balance) return alert("Insufficient balance!");

    setIsProcessing(true);

    // SIMULATE MOBILE MONEY API DELAY (Wait 3 seconds for user to "enter PIN" on USSD prompt)
    setTimeout(async () => {
      try {
        const modifier = showModal === 'deposit' ? numAmount : -numAmount;
        const newBalance = currentUser.balance + modifier;
        
        await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);
        setCurrentUser(prev => ({ ...prev, balance: newBalance }));
        
        alert(`${showModal === 'deposit' ? 'Deposit' : 'Withdrawal'} Successful!`);
        setShowModal(null);
        setAmount('');
      } catch (err) {
        alert("Transaction Failed: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    }, 3000);
  };

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
        <div style={{display: 'flex', gap: '15px'}}>
          <button className="btn-success" onClick={() => setShowModal('deposit')} style={{padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><ArrowDownToLine size={18} style={{marginRight: '8px'}}/> Deposit</button>
          <button className="btn-outline" onClick={() => setShowModal('withdraw')} style={{marginTop: 0, padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.05)'}}><ArrowUpFromLine size={18} style={{marginRight: '8px'}}/> Withdraw</button>
        </div>
      </div>

      <div className="card" style={{padding: 0, overflow: 'hidden'}}><div style={{padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between'}}><span>Transaction History</span> <span style={{color: '#64748b'}}>&gt;</span></div><div style={{padding: '15px 20px', display: 'flex', justifyContent: 'space-between'}}><span>Payment Methods</span> <span style={{color: '#64748b'}}>Mobile Money &gt;</span></div></div>
      <button className="btn-outline" onClick={() => setCurrentUser(null)} style={{borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><LogOut size={20} style={{marginRight: '10px'}}/> LOGOUT</button>

      {/* TRANSACTION MODAL */}
      {showModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
          <div className="card" style={{margin: 0, position: 'relative', textAlign: 'center'}}>
            <button onClick={() => !isProcessing && setShowModal(null)} style={{position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: '#94a3b8'}}><X size={24}/></button>
            <h2 style={{marginBottom: '20px', marginTop: '10px'}}>{showModal === 'deposit' ? 'Deposit Funds' : 'Withdraw Winnings'}</h2>
            
            {isProcessing ? (
              <div style={{padding: '30px 0'}}>
                <Loader2 className="animate-spin mx-auto" size={50} color="#3b82f6" style={{marginBottom: '20px'}}/>
                <p style={{color: '#3b82f6', fontWeight: 'bold'}}>{showModal === 'deposit' ? 'Please check your phone for the M-Pesa/Tigo Pesa PIN prompt...' : 'Processing payout...'}</p>
              </div>
            ) : (
              <>
                <p style={{color: '#94a3b8', fontSize: '0.9rem', marginBottom: '15px'}}>Amount will be processed via {currentUser.phone}</p>
                <input type="number" placeholder="Amount (TZS)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{fontSize: '1.5rem', textAlign: 'center', fontWeight: 'bold'}} />
                <button className="btn-primary" onClick={handleTransaction}>CONFIRM {showModal === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL'}</button>
              </>
            )}
          </div>
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

function LoginScreen({ setCurrentUser }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!phone || !pin) return alert("Please enter both Phone and PIN");
    setLoading(true);
    
    try {
      const { data: user, error: fetchError } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle();
      
      if (user) {
        if (user.pin !== pin) throw new Error("Incorrect PIN");
        setCurrentUser(user);
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ phone, pin, balance: 5000 }])
          .select().single();
          
        if (insertError) throw insertError;
        alert("Account Created! You've been given a TZS 5,000 testing balance.");
        setCurrentUser(newUser);
      }
    } catch (err) {
      alert("Authentication Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen" style={{justifyContent: 'center', paddingTop: '10vh'}}>
      <div style={{width: '90px', height: '90px', background: 'var(--primary-gradient)', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)', marginBottom: '30px', boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'}}><Gamepad2 size={45} color="white" style={{transform: 'rotate(-12deg)'}} /></div>
      <h1 className="title" style={{fontSize: '3.5rem'}}>123 BET</h1><p style={{color: '#94a3b8', marginBottom: '40px'}}>Login to enter the arena.</p>
      
      <input type="text" placeholder="Phone Number (e.g. 0712345678)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input type="password" placeholder="4-Digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
      
      <button className="btn-primary" onClick={handleAuth} style={{marginTop: '20px'}}>
        {loading ? <Loader2 className="animate-spin mx-auto" /> : "SECURE LOGIN / REGISTER"}
      </button>
    </div>
  );
}
