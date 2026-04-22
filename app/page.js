'use client'; // Vercel CSS Cache Buster Comment: Correcting UI Alignment
import { useState, useEffect } from 'react';
import { Home, Gamepad2, User, Wallet, ArrowDownToLine, ArrowUpFromLine, LogOut, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [balance, setBalance] = useState(5000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] pointer-events-none"></div>

      {/* Main Content Area - Center Aligned & Modern */}
      <div className="flex-1 overflow-y-auto pb-32 z-10 flex flex-col items-center pt-8 px-4 w-full">
        {!isLoggedIn ? (
          <LoginScreen setIsLoggedIn={setIsLoggedIn} />
        ) : (
          <>
            {activeTab === 'home' && <LandingView setActiveTab={setActiveTab} />}
            {activeTab === 'play' && <GameEngine balance={balance} setBalance={setBalance} />}
            {activeTab === 'profile' && <ProfileView balance={balance} setIsLoggedIn={setIsLoggedIn} />}
          </>
        )}
      </div>

      {/* Mobile Bottom Navigation - Premium & Safe Padding */}
      {isLoggedIn && (
        <nav className="fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50 px-6 py-3 pb-safe">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <NavItem icon={<Home />} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavItem icon={<Gamepad2 />} label="Play" isActive={activeTab === 'play'} onClick={() => setActiveTab('play')} isCenter />
            <NavItem icon={<User />} label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </nav>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

function NavItem({ icon, label, isActive, onClick, isCenter }) {
  if (isCenter) {
    return (
      <button onClick={onClick} className="flex flex-col items-center justify-center -mt-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${isActive ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-cyan-500/50' : 'bg-slate-800 border-4 border-slate-900 text-slate-400'}`}>
          {icon}
        </div>
        <span className={`text-xs mt-1 font-semibold ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>{label}</span>
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`flex flex-col items-center p-2 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
      {icon}
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
}

function LandingView({ setActiveTab }) {
  return (
    <div className="p-6 max-w-md mx-auto pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full text-center flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 tracking-tight">123 BET</h1>
        <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">Fastest PvP in Tanzania</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6 mb-8 shadow-xl text-left">
        <h2 className="text-xl font-bold mb-4 flex items-center text-cyan-100"><Info className="mr-2 w-5 h-5 text-cyan-400"/> How to Play</h2>
        <ul className="space-y-4 text-slate-300 text-sm">
          <li className="flex items-start"><span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0">1</span> Match against a real player. Stake TZS 1,000.</li>
          <li className="flex items-start"><span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0">2</span> You have exactly 10 seconds to choose 1, 2, or 3.</li>
          <li className="flex items-start"><span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 shrink-0">3</span> The winner takes the pot instantly!</li>
        </ul>
      </div>

      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-6 shadow-xl mb-12 w-full">
        <h2 className="text-xl font-bold mb-6 text-center text-indigo-100">The Rules of Combat</h2>
        <div className="grid grid-cols-1 gap-3">
          <RuleRow winner="1" loser="3" />
          <RuleRow winner="2" loser="1" />
          <RuleRow winner="3" loser="2" />
        </div>
      </div>

      <button onClick={() => setActiveTab('play')} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xl py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
        ENTER ARENA NOW
      </button>
    </div>
  );
}

function RuleRow({ winner, loser }) {
  return (
    <div className="flex items-center justify-between bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
      <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-2xl font-black text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">{winner}</div>
      <span className="text-slate-400 font-bold uppercase text-sm tracking-wider text-center flex-1">Beats</span>
      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-500">{loser}</div>
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
      setBalance(prev => prev + 1000); // 100% Refund (Image 3 correct)
    } else if (
      (selectedNumber === 1 && oppChoice === 3) ||
      (selectedNumber === 2 && oppChoice === 1) ||
      (selectedNumber === 3 && oppChoice === 2)
    ) {
      setResult('WIN');
      setBalance(prev => prev + 1800); // Winnings minus 10% rake
    } else {
      setResult('LOSS');
    }
    setGameState('result');
  };

  return (
    <div className="p-6 max-w-md mx-auto pt-8 flex flex-col animate-in fade-in zoom-in-95 duration-300 w-full text-center">
      <div className="flex justify-between items-center mb-10 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50 w-full text-center">
        <span className="text-slate-400 font-medium">Wallet Balance</span>
        <span className="font-mono text-green-400 font-bold text-lg">TZS {balance.toLocaleString()}</span>
      </div>

      <div className="flex flex-col items-center justify-center w-full">
        {gameState === 'lobby' && (
          <div className="w-full flex flex-col items-center">
            <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
               <Gamepad2 className="w-16 h-16 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center w-full">Find Opponent</h2>
            <p className="text-slate-400 mb-8 w-full text-center">Stake: TZS 1,000 | Win: TZS 1,800</p>
            <button onClick={startGame} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-2xl py-5 rounded-2xl shadow-lg shadow-green-500/30 active:scale-95 transition-all">
              FIND MATCH
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="w-full flex flex-col items-center w-full">
            <div className="w-full h-3 bg-slate-800 rounded-full mb-8 overflow-hidden">
               <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all ease-linear duration-1000" style={{ width: `${(timer / 10) * 100}%` }}></div>
            </div>
            <div className="text-7xl font-black mb-8 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{timer}</div>
            
            <p className="mb-6 text-slate-400 uppercase tracking-widest font-bold w-full text-center">Make Your Choice</p>
            
            <div className="grid grid-cols-3 gap-4 w-full mb-10">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedNumber(num)}
                  className={`py-10 text-5xl font-black rounded-2xl transition-all ${
                    selectedNumber === num 
                    ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] scale-105 border-2 border-white/50' 
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            {selectedNumber && (
              <button onClick={resolveMatch} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xl py-4 rounded-2xl shadow-lg animate-in slide-in-from-bottom-4">
                LOCK IN BET
              </button>
            )}
          </div>
        )}

        {gameState === 'result' && (
          <div className="w-full text-center flex flex-col items-center animate-in zoom-in duration-300">
            <h2 className={`text-6xl font-black mb-12 tracking-tighter drop-shadow-lg ${result === 'WIN' ? 'text-green-400' : result === 'TIE' ? 'text-yellow-400' : 'text-red-500'}`}>
              {result}
            </h2>
            
            <div className="flex justify-between items-center w-full mb-12 px-2">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 mb-3 font-semibold tracking-wider text-sm uppercase">You</span>
                <div className="w-24 h-24 flex items-center justify-center bg-slate-800 rounded-2xl text-5xl font-black border-2 border-slate-600 shadow-inner">
                  {selectedNumber || 'X'}
                </div>
              </div>
              
              <div className="text-slate-600 font-black text-3xl italic">VS</div>

              <div className="flex flex-col items-center">
                <span className="text-slate-400 mb-3 font-semibold tracking-wider text-sm uppercase">Opponent</span>
                <div className="w-24 h-24 flex items-center justify-center bg-slate-800 rounded-2xl text-5xl font-black border-2 border-red-900/50 shadow-inner text-red-400">
                  {opponentNumber}
                </div>
              </div>
            </div>

            <button onClick={() => setGameState('lobby')} className="w-full bg-slate-800 text-white font-bold text-xl py-4 rounded-2xl active:scale-95 border border-slate-700 hover:bg-slate-700 transition-all">
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileView({ balance, setIsLoggedIn }) {
  return (
    <div className="p-6 max-w-md mx-auto pt-12 animate-in fade-in slide-in-from-right-4 duration-300 w-full text-center flex flex-col items-center">
      <div className="flex items-center mb-10 w-full justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg mr-4">
          CM
        </div>
        <div className="text-left">
          <h2 className="text-2xl font-bold">Carlson</h2>
          <p className="text-slate-400 text-sm">carlson@example.com</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-3xl mb-8 shadow-2xl relative overflow-hidden w-full text-center">
        <Wallet className="absolute -bottom-4 -right-4 w-32 h-32 text-slate-700/30 rotate-12" />
        <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-1 w-full">Available Balance</p>
        <h3 className="text-4xl font-mono font-black text-white mb-6 w-full text-center">TZS {balance.toLocaleString()}</h3>
        
        <div className="flex gap-4 relative z-10 w-full">
          <button className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl flex items-center justify-center transition-colors">
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Deposit
          </button>
          <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center transition-colors">
            <ArrowUpFromLine className="w-4 h-4 mr-2" /> Withdraw
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl overflow-hidden mb-8 w-full text-left">
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center text-slate-300">
          <span className="font-medium">Transaction History</span>
          <span className="text-slate-500 text-sm">View &gt;</span>
        </div>
        <div className="p-4 flex justify-between items-center text-slate-300">
          <span className="font-medium">Payment Methods</span>
          <span className="text-slate-500 text-sm">Mobile Money &gt;</span>
        </div>
      </div>

      <button onClick={() => setIsLoggedIn(false)} className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-lg py-4 rounded-2xl flex items-center justify-center active:bg-red-500/20 transition-all">
        <LogOut className="w-5 h-5 mr-2" /> LOGOUT
      </button>
    </div>
  );
}

function LoginScreen({ setIsLoggedIn }) {
  return (
    <div className="h-full flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center animate-in zoom-in-95 duration-500 w-full pt-16">
      <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl rotate-12 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(59,130,246,0.5)]">
        <Gamepad2 className="w-12 h-12 text-white -rotate-12" />
      </div>
      <h1 className="text-4xl font-black mb-2 w-full text-center">123 BET</h1>
      <p className="text-slate-400 mb-12 w-full text-center">Login to enter the arena.</p>
      
      <div className="w-full space-y-4 flex flex-col items-center justify-center">
        <input type="text" placeholder="Phone Number" className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center" />
        <input type="password" placeholder="PIN" className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center" />
        <button onClick={() => setIsLoggedIn(true)} className="w-full max-w-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-lg py-4 rounded-xl shadow-lg mt-4 active:scale-95 transition-all">
          SECURE LOGIN
        </button>
      </div>
    </div>
  );
}
