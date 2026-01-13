
import React, { useState, useEffect } from 'react';

type GameType = 'none' | 'ttt' | 'rps' | 'math';

const Arcade: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>('none');

  return (
    <div className="h-full flex flex-col overflow-hidden bg-transparent">
      <header className="h-16 border-b-4 border-white flex items-center justify-between px-6 bg-white/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕹️</span>
          <h1 className="text-xl font-black text-purple-900 tracking-tight">Helpfulat Arcade</h1>
        </div>
        {activeGame !== 'none' && (
          <button 
            onClick={() => setActiveGame('none')}
            className="px-4 py-2 bg-white text-purple-700 font-bold rounded-xl border-b-4 border-purple-200 hover:bg-purple-50 transition-all text-sm shadow-sm active:translate-y-0.5 active:border-b-2"
          >
            ← Exit Game
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar">
        {activeGame === 'none' && (
          <div className="max-w-4xl w-full">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-purple-900 mb-2">Welcome to the Zone!</h2>
              <p className="text-purple-800/60 font-bold">Pick a game to challenge Helpfulat's brain!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GameCard 
                icon="❌⭕" 
                title="Tic Tac Toe" 
                desc="The classic strategy match. Can you outsmart the AI?" 
                onClick={() => setActiveGame('ttt')}
                color="bg-blue-500"
              />
              <GameCard 
                icon="🪨✂️" 
                title="R-P-S" 
                desc="Rock, Paper, Scissors! Best of 3 wins the crown." 
                onClick={() => setActiveGame('rps')}
                color="bg-orange-500"
              />
              <GameCard 
                icon="🧮" 
                title="Math Duel" 
                desc="Speedy calculations! Beat the timer and the AI." 
                onClick={() => setActiveGame('math')}
                color="bg-emerald-500"
              />
            </div>
          </div>
        )}

        {activeGame === 'ttt' && <TicTacToe />}
        {activeGame === 'rps' && <RockPaperScissors />}
        {activeGame === 'math' && <MathDuel />}
      </div>
    </div>
  );
};

const GameCard = ({ icon, title, desc, onClick, color }: { icon: string, title: string, desc: string, onClick: () => void, color: string }) => (
  <button 
    onClick={onClick}
    className="bg-white p-6 rounded-[2rem] border-b-8 border-gray-100 hover:border-purple-300 hover:scale-[1.02] transition-all text-left shadow-lg group"
  >
    <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner transform group-hover:rotate-6 transition-transform text-white`}>
      {icon}
    </div>
    <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm font-bold leading-relaxed">{desc}</p>
  </button>
);

const TicTacToe = () => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (winner || board[i] || !isXNext) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
  };

  useEffect(() => {
    if (!isXNext && !winner) {
      const timer = setTimeout(() => {
        const currentWin = calculateWinner(board);
        if (currentWin || !board.includes(null)) {
          setWinner(currentWin || 'Draw');
          return;
        }

        const emptyIndices = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
        const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const newBoard = [...board];
        newBoard[randomMove] = 'O';
        setBoard(newBoard);
        setIsXNext(true);
        
        const nextWin = calculateWinner(newBoard);
        if (nextWin) setWinner(nextWin);
        else if (!newBoard.includes(null)) setWinner('Draw');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isXNext, board, winner]);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-white max-w-sm w-full animate-in zoom-in duration-300">
      <h3 className="text-2xl font-black text-blue-900 mb-6 uppercase tracking-widest">Tic Tac Toe</h3>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {board.map((val, i) => (
          <button 
            key={i} 
            onClick={() => handleClick(i)}
            disabled={!!val || !isXNext || !!winner}
            className={`w-20 h-20 rounded-2xl text-4xl font-black flex items-center justify-center transition-all shadow-sm ${
              val === 'X' ? 'text-blue-500 bg-blue-50' : val === 'O' ? 'text-red-500 bg-red-50' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
      {winner && (
        <div className="text-center mb-6">
          <p className="text-xl font-black text-gray-800 mb-4">
            {winner === 'Draw' ? "It's a Tie! 🤝" : winner === 'X' ? "You Won! 🏆" : "Helpfulat Won! 🧠"}
          </p>
          <button onClick={reset} className="px-8 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">Play Again</button>
        </div>
      )}
      {!winner && <p className="font-bold text-gray-400">{isXNext ? 'Your Turn (X)' : 'Helpfulat is thinking...'}</p>}
    </div>
  );
};

const RockPaperScissors = () => {
  const choices = ['🪨', '📜', '✂️'];
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [aiChoice, setAiChoice] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [scores, setScores] = useState({ player: 0, ai: 0 });

  const handlePlay = (choice: string) => {
    setPlayerChoice(choice);
    const ai = choices[Math.floor(Math.random() * 3)];
    setAiChoice(ai);
    
    let res = "";
    if (choice === ai) res = "Draw!";
    else if (
      (choice === '🪨' && ai === '✂️') ||
      (choice === '📜' && ai === '🪨') ||
      (choice === '✂️' && ai === '📜')
    ) {
      res = "You Win!";
      setScores(s => ({ ...s, player: s.player + 1 }));
    } else {
      res = "Helpfulat Wins!";
      setScores(s => ({ ...s, ai: s.ai + 1 }));
    }
    setResult(res);
  };

  const nextRound = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-white max-w-sm w-full animate-in zoom-in duration-300">
      <h3 className="text-2xl font-black text-orange-900 mb-2 uppercase tracking-widest">R-P-S Duel</h3>
      <div className="flex gap-8 mb-8 text-sm font-black">
        <div className="text-center"><p className="text-gray-400">YOU</p><p className="text-2xl text-orange-600">{scores.player}</p></div>
        <div className="text-center"><p className="text-gray-400">AI</p><p className="text-2xl text-red-600">{scores.ai}</p></div>
      </div>

      <div className="flex gap-4 mb-10">
        {choices.map(c => (
          <button 
            key={c}
            onClick={() => handlePlay(c)}
            disabled={!!result}
            className={`w-20 h-20 text-3xl rounded-3xl border-b-4 transition-all shadow-sm ${
              playerChoice === c ? 'bg-orange-500 text-white border-orange-700 scale-110' : 'bg-gray-50 border-gray-200 hover:bg-orange-50 active:translate-y-0.5'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {result && (
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-center gap-6 mb-6 bg-gray-50 p-4 rounded-2xl">
            <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">You</p><p className="text-4xl">{playerChoice}</p></div>
            <div className="text-xl font-bold text-gray-300">VS</div>
            <div className="text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">AI</p><p className="text-4xl">{aiChoice}</p></div>
          </div>
          <p className="text-2xl font-black text-gray-800 mb-4">{result}</p>
          <button onClick={nextRound} className="px-8 py-3 bg-orange-500 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Next Round</button>
        </div>
      )}
    </div>
  );
};

const MathDuel = () => {
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', ans: 0 });
  const [userAns, setUserAns] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isGameOver, setIsGameOver] = useState(false);

  const generateProblem = () => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let ans = 0;
    if (op === '+') ans = a + b;
    if (op === '-') ans = a - b;
    if (op === '*') ans = a * b;
    setProblem({ a, b, op, ans });
    setUserAns('');
  };

  useEffect(() => {
    generateProblem();
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsGameOver(true);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAns) === problem.ans) {
      setScore(s => s + 1);
      setTimeLeft(t => Math.min(t + 2, 20)); // Bonus time
      generateProblem();
    } else {
      setUserAns('');
    }
  };

  const restart = () => {
    setScore(0);
    setTimeLeft(15);
    setIsGameOver(false);
    generateProblem();
  };

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-white max-w-sm w-full animate-in zoom-in duration-300">
      <h3 className="text-2xl font-black text-emerald-900 mb-4 uppercase tracking-widest">Math Duel</h3>
      
      {!isGameOver ? (
        <>
          <div className="w-full bg-gray-100 h-3 rounded-full mb-6 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} 
              style={{ width: `${(timeLeft/20)*100}%` }}
            ></div>
          </div>
          <div className="text-center mb-8">
            <p className="text-5xl font-black text-gray-800">{problem.a} <span className="text-emerald-500">{problem.op === '*' ? '×' : problem.op}</span> {problem.b}</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full">
            <input 
              autoFocus
              type="number"
              value={userAns}
              onChange={(e) => setUserAns(e.target.value)}
              className="w-full bg-gray-50 border-4 border-emerald-100 rounded-2xl p-4 text-center text-3xl font-black focus:outline-none focus:border-emerald-500 transition-all mb-4 shadow-inner"
              placeholder="?"
            />
            <div className="flex justify-between items-center px-2">
              <span className="font-black text-emerald-600">Score: {score}</span>
              <span className="font-black text-orange-500">{timeLeft}s Left</span>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center">
          <p className="text-6xl mb-4">⏰</p>
          <p className="text-xl font-black text-gray-800 mb-2">Time Up!</p>
          <p className="text-3xl font-black text-emerald-600 mb-6">Final Score: {score}</p>
          <button onClick={restart} className="px-10 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">Try Again</button>
        </div>
      )}
    </div>
  );
};

export default Arcade;
