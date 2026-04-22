'use client';
import { useState, useEffect } from 'react';
import { Home, Gamepad2, User, Wallet, ArrowDownToLine, ArrowUpFromLine, LogOut, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(5000);

  return (
    <div className="app-container">
      {!isLoggedIn ? (
        <LoginScreen setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <>
          {activeTab === 'home' && <LandingView setActiveTab={setActiveTab} />}
          {activeTab === 'play' && <GameEngine balance={balance} setBalance={setBalance} />}
          {activeTab === 'profile' && <ProfileView balance={balance} setIsLoggedIn={setIsLoggedIn} />}
          
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

function LandingView({ setActiveTab }) {
  return (
    <div className="screen">
      <h1 className="title">123 BET</h1>
      <p className="subtitle">Fastest PvP in Tanzania</p>

      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', color: '#cffafe', marginBottom: '15px' }}>
          <Info size={20} style={{ marginRight: '8px', color: '#38bdf8' }}/> How to Play
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>
          <strong>1.</strong> Match against a real player. Stake TZS 1,000.<br/>
          <strong>2.</strong> You have 10 seconds to choose 1, 2, or 3.<br/>
          <strong>3.</strong> The winner takes the pot instantly!
        </p>
      </div>

      <div className="card" style={{ background: 'rgba(49, 46, 129, 0.4)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
        <h2 style={{ textAlign: 'center', color: '#e0e7ff', marginBottom: '20px' }}>Rules of Combat</h2>
        <div className="rule-row">
          <div className="rule-box winner">1</div>
          <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold'}}>BEATS</span>
          <div className="rule-box">3</div>
        </div>
        <div className="rule-row">
          <div className="rule-box winner">2</div>
          <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold'}}>BEATS</span>
          <div className="rule-box">1</div>
        </div>
        <div className="rule-row">
          <div className="rule-box winner">3</div>
          <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold'}}>BEATS</span>
          <div className="rule-box">2</div>
        </div>
      </div>

      <button className="btn-primary" onClick={() => setActiveTab('play')}>
        ENTER ARENA NOW
      </button>
    </div>
  );
}

function GameEngine({ balance, setBalance }) {
  const [gameState, setGameState] = useState('lobby');
  const [timer, setTimer] = useState(10);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [opponentNumber, setOpponentNumber] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let interval;
    if (gameState === 'playing' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (gameState === 'playing' && timer === 0) {
      resolveMatch();
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const startGame = () => {
    if (balance < 1000) return alert("Insufficient funds. Go to Profile to deposit.");
    setBalance(prev => prev - 1000);
    setGameState('playing');
    setTimer(10);
    setSelectedNumber(null);
    setOpponentNumber(null);
    setResult(null);
  };

  const resolveMatch = () => {
    const oppChoice = Math.floor(Math.random() * 3) + 1;
    setOpponentNumber(oppChoice);
    
    if (!selectedNumber) {
      setResult('TIMEOUT');
      setGameState('result');
      return;
    }

    if (selectedNumber === oppChoice) {
      setResult('TIE');
      setBalance(prev => prev + 1000); 
    } else if (
      (selectedNumber === 1 && oppChoice === 3) ||
      (selectedNumber === 2 && oppChoice === 1) ||
      (selectedNumber === 3 && oppChoice === 2)
    ) {
      setResult('WIN');
      setBalance(prev => prev + 1800); 
    } else {
      setResult('LOSS');
    }
    setGameState('result');
  };

  return (
    <div className="screen">
      <div className="header-bar">
        <span style={{color: '#94a3b8'}}>Wallet Balance</span>
        <span className="balance-text">TZS {balance.toLocaleString()}</span>
      </div>

      {gameState === 'lobby' && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px'}}>
          <div style={{background: 'rgba(59, 130, 246, 0.1)', padding: '30px', borderRadius: '50%', marginBottom: '20px'}}>
             <Gamepad2 size={60} color="#60a5fa" />
          </div>
          <h2>Find Opponent</h2>
          <p style={{color: '#94a3b8', marginBottom: '30px'}}>Stake: TZS 1,000 | Win: TZS 1,800</p>
          <button className="btn-success" onClick={startGame}>FIND MATCH</button>
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
              <button
                key={num}
                onClick={() => setSelectedNumber(num)}
                className={`btn-number ${selectedNumber === num ? 'selected' : ''}`}
              >
                {num}
              </button>
            ))}
          </div>
          {selectedNumber && (
            <button className="btn-primary" onClick={resolveMatch}>LOCK IN BET</button>
          )}
        </div>
      )}

      {gameState === 'result' && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <h2 className={`result-text ${result === 'WIN' ? 'win' : result === 'TIE' ? 'tie' : 'loss'}`}>
            {result}
          </h2>
          
          <div className="versus-row">
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <span style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '10px'}}>YOU</span>
              <div className="player-box">{selectedNumber || 'X'}</div>
            </div>
            
            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#475569', fontStyle: 'italic'}}>VS</div>

            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <span style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '10px'}}>OPPONENT</span>
              <div className="player-box" style={{borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444'}}>{opponentNumber}</div>
            </div>
          </div>

          <button className="btn-outline" onClick={() => setGameState('lobby')}>PLAY AGAIN</button>
        </div>
      )}
    </div>
  );
}

function ProfileView({ balance, setIsLoggedIn }) {
  return (
    <div className="screen">
      <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: '30px'}}>
        <div style={{width: '60px', height: '60px', borderRadius: '30px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', marginRight: '15px'}}>
          CM
        </div>
        <div style={{textAlign: 'left'}}>
          <h2 style={{marginBottom: '2px'}}>Carlson</h2>
          <p style={{color: '#94a3b8', fontSize: '0.9rem', margin: 0}}>carlson@example.com</p>
        </div>
      </div>

      <div className="card" style={{textAlign: 'center', padding: '30px 20px'}}>
        <p style={{color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Available Balance</p>
        <h3 style={{fontSize: '2.5rem', fontFamily: 'monospace', margin: '15px 0 25px 0'}}>TZS {balance.toLocaleString()}</h3>
        
        <div style={{display: 'flex', gap: '15px'}}>
          <button className="btn-success" style={{padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <ArrowDownToLine size={18} style={{marginRight: '8px'}}/> Deposit
          </button>
          <button className="btn-outline" style={{marginTop: 0, padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.05)'}}>
            <ArrowUpFromLine size={18} style={{marginRight: '8px'}}/> Withdraw
          </button>
        </div>
      </div>

      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between'}}>
          <span>Transaction History</span> <span style={{color: '#64748b'}}>&gt;</span>
        </div>
        <div style={{padding: '15px 20px', display: 'flex', justifyContent: 'space-between'}}>
          <span>Payment Methods</span> <span style={{color: '#64748b'}}>Mobile Money &gt;</span>
        </div>
      </div>

      <button className="btn-outline" onClick={() => setIsLoggedIn(false)} style={{borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <LogOut size={20} style={{marginRight: '10px'}}/> LOGOUT
      </button>
    </div>
  );
}

function LoginScreen({ setIsLoggedIn }) {
  return (
    <div className="screen" style={{justifyContent: 'center', paddingTop: '10vh'}}>
      <div style={{width: '90px', height: '90px', background: 'var(--primary-gradient)', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)', marginBottom: '30px', boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'}}>
        <Gamepad2 size={45} color="white" style={{transform: 'rotate(-12deg)'}} />
      </div>
      <h1 className="title" style={{fontSize: '3.5rem'}}>123 BET</h1>
      <p style={{color: '#94a3b8', marginBottom: '40px'}}>Login to enter the arena.</p>
      
      <input type="text" placeholder="Phone Number" />
      <input type="password" placeholder="PIN" />
      <button className="btn-primary" onClick={() => setIsLoggedIn(true)} style={{marginTop: '20px'}}>
        SECURE LOGIN
      </button>
    </div>
  );
}
