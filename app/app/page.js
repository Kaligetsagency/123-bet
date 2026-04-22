'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [gameState, setGameState] = useState('lobby'); // lobby, playing, result
  const [timer, setTimer] = useState(10);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [opponentNumber, setOpponentNumber] = useState(null);
  const [result, setResult] = useState(null);
  const [balance, setBalance] = useState(5000);

  // Timer Logic
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
    if (balance < 1000) return alert("Insufficient funds");
    setBalance(prev => prev - 1000);
    setGameState('playing');
    setTimer(10);
    setSelectedNumber(null);
    setOpponentNumber(null);
    setResult(null);
  };

  const resolveMatch = () => {
    // Simulate opponent choice (1, 2, or 3) for frontend testing
    const oppChoice = Math.floor(Math.random() * 3) + 1;
    setOpponentNumber(oppChoice);
    
    // Auto-forfeit if user didn't pick
    if (!selectedNumber) {
      setResult('LOSS (TIME OUT)');
      setGameState('result');
      return;
    }

    // 123 Bet Logic: 1 beats 3, 2 beats 1, 3 beats 2
    if (selectedNumber === oppChoice) {
      setResult('TIE');
      setBalance(prev => prev + 1000); // Refund stake
    } else if (
      (selectedNumber === 1 && oppChoice === 3) ||
      (selectedNumber === 2 && oppChoice === 1) ||
      (selectedNumber === 3 && oppChoice === 2)
    ) {
      setResult('WIN');
      setBalance(prev => prev + 1800); // Winnings minus 10% rake on 2000 pot
    } else {
      setResult('LOSS');
    }
    setGameState('result');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-yellow-400">123 BET</h1>
        <div className="bg-slate-800 px-4 py-2 rounded-full font-mono text-green-400">
          TZS {balance}
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 w-full max-w-md flex flex-col items-center justify-center">
        
        {gameState === 'lobby' && (
          <div className="text-center w-full">
            <h2 className="text-xl mb-6 text-slate-300">Stake: TZS 1,000 | To Win: TZS 1,800</h2>
            <button 
              onClick={startGame}
              className="w-full bg-yellow-500 text-black font-bold text-2xl py-4 rounded-xl active:bg-yellow-600 transition-colors"
            >
              FIND MATCH
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="w-full flex flex-col items-center">
            <div className="text-6xl font-black mb-8 text-white">{timer}s</div>
            <p className="mb-4 text-slate-400">Choose your number!</p>
            <div className="grid grid-cols-3 gap-4 w-full mb-8">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedNumber(num)}
                  className={`py-8 text-4xl font-bold rounded-xl transition-all ${
                    selectedNumber === num 
                    ? 'bg-yellow-400 text-black scale-105 border-4 border-white' 
                    : 'bg-slate-800 text-white hover:bg-slate-700 border-4 border-transparent'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            {selectedNumber && (
              <button 
                onClick={resolveMatch}
                className="w-full bg-green-500 text-white font-bold text-xl py-4 rounded-xl active:bg-green-600"
              >
                CONFIRM BET
              </button>
            )}
          </div>
        )}

        {gameState === 'result' && (
          <div className="w-full text-center flex flex-col items-center">
            <h2 className={`text-4xl font-black mb-6 ${result === 'WIN' ? 'text-green-400' : result === 'TIE' ? 'text-yellow-400' : 'text-red-500'}`}>
              {result}
            </h2>
            <div className="flex justify-between w-full mb-8 px-4">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 mb-2">You</span>
                <div className="w-20 h-20 flex items-center justify-center bg-slate-800 rounded-xl text-3xl font-bold border-2 border-slate-600">
                  {selectedNumber || 'X'}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 mb-2">Opponent</span>
                <div className="w-20 h-20 flex items-center justify-center bg-slate-800 rounded-xl text-3xl font-bold border-2 border-red-900/50">
                  {opponentNumber}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setGameState('lobby')}
              className="w-full bg-slate-700 text-white font-bold text-xl py-4 rounded-xl active:bg-slate-600"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
