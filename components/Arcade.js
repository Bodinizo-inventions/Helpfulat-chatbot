
import React, { useState } from 'react';

export default function Arcade() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  
  const calculateWinner = (squares) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return squares.includes(null) ? null : 'Draw';
  };

  const winner = calculateWinner(board);

  const handleClick = (i) => {
    if (winner || board[i]) return;
    const nextBoard = board.slice();
    nextBoard[i] = 'X';
    setBoard(nextBoard);
    
    // Simple AI Move
    setTimeout(() => {
        const winCheck = calculateWinner(nextBoard);
        if (winCheck) return;
        const empty = nextBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
        if (empty.length > 0) {
            const move = empty[Math.floor(Math.random() * empty.length)];
            nextBoard[move] = 'O';
            setBoard([...nextBoard]);
        }
    }, 400);
  };

  return (
    <div className="p-10 flex flex-col items-center animate-in zoom-in duration-500">
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border-4 border-white max-w-md w-full">
        <h2 className="text-4xl font-black text-purple-900 mb-2 text-center">Arcade Zone</h2>
        <p className="text-purple-700/60 font-bold mb-8 text-center uppercase text-xs tracking-widest">Beat the AI at Tic-Tac-Toe</p>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          {board.map((val, i) => (
            <button 
              key={i} 
              onClick={() => handleClick(i)}
              className={`h-24 rounded-[1.5rem] text-4xl font-black flex items-center justify-center transition-all border-b-8 ${
                val === 'X' ? 'bg-sky-100 text-sky-600 border-sky-200' : 
                val === 'O' ? 'bg-purple-100 text-purple-600 border-purple-200' : 
                'bg-gray-50 text-gray-200 border-gray-100 hover:bg-white active:translate-y-2 active:border-b-0'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {winner && (
          <div className="text-center animate-bounce">
            <p className="text-2xl font-black text-purple-900 mb-4">
               {winner === 'Draw' ? "It's a Draw! 🤝" : `${winner === 'X' ? 'You' : 'Helpfulat'} Won! 🏆`}
            </p>
            <button 
              onClick={() => setBoard(Array(9).fill(null))}
              className="px-8 py-3 bg-purple-600 text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-all"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
