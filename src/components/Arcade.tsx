import React, { useState } from 'react';

export const Arcade: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));

  const calculateWinner = (sq: (string | null)[]): string | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let [a, b, c] of lines) {
      if (sq[a] && sq[a] === sq[b] && sq[a] === sq[c]) return sq[a];
    }
    return sq.includes(null) ? null : 'Draw';
  };

  const winner = calculateWinner(board);

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const nb = [...board];
    nb[i] = 'X';
    setBoard(nb);

    setTimeout(() => {
      if (calculateWinner(nb)) return;
      const empty = nb.map((v, idx) => (v === null ? idx : null)).filter(v => v !== null);
      if (empty.length > 0) {
        nb[empty[Math.floor(Math.random() * empty.length)]] = 'O';
        setBoard([...nb]);
      }
    }, 400);
  };

  return (
    <div className="p-10 flex flex-col items-center">
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border-4 border-white max-w-md w-full">
        <h2 className="text-4xl font-black text-purple-900 mb-8 text-center">Arcade</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {board.map((val, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`h-24 rounded-[1.5rem] text-4xl font-black flex items-center justify-center border-b-8 ${
                val === 'X'
                  ? 'bg-sky-100 text-sky-600 border-sky-200'
                  : val === 'O'
                    ? 'bg-purple-100 text-purple-600 border-purple-200'
                    : 'bg-gray-50 border-gray-100'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
        {winner && (
          <div className="text-center">
            <p className="text-2xl font-black mb-4">{winner === 'Draw' ? 'Draw!' : winner + ' Wins!'}</p>
            <button
              onClick={() => setBoard(Array(9).fill(null))}
              className="bg-purple-600 text-white px-8 py-2 rounded-xl font-bold"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
