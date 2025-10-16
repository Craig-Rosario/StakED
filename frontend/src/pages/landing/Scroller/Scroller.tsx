import { useEffect, useState } from "react";

interface Student {
  id: string;
  name: string;
  ticker: string;
  dailyChange: number;
}

const students: Student[] = [
  { id: "1", name: "Craig", ticker: "CRA", dailyChange: 4.2 },
  { id: "2", name: "Saish", ticker: "SAI", dailyChange: 2.8 },
  { id: "3", name: "Arnav", ticker: "ARNV", dailyChange: 1.5 },
  { id: "4", name: "Dhanush", ticker: "DHA", dailyChange: -1.1 },
  { id: "5", name: "Cheryl", ticker: "CHE", dailyChange: 0.8 },
  { id: "6", name: "Tim", ticker: "TIM", dailyChange: -2.4 },
  { id: "6", name: "Bill", ticker: "BIL", dailyChange: -2.4 },
  { id: "6", name: "Jake", ticker: "JKE", dailyChange: 3.4 },
];

const Scroller = () => {
  const [liveUpdate, setLiveUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setLiveUpdate((prev) => prev + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full border-b-4 border-foreground bg-[#111111] overflow-hidden">
      <div className="flex animate-scroll items-center gap-8 sm:gap-12 md:gap-16 py-2 sm:py-3 md:py-4 px-2">
        {[...students, ...students, ...students].map((student, index) => {
          const isPositive = student.dailyChange >= 0;
          const blink = liveUpdate % 2 === 0 && index % 3 === 0;

          return (
            <div
              key={`${student.id}-${index}`}
              className={`mono flex shrink-0 items-center gap-1 sm:gap-2 px-2 sm:px-4 transition-opacity ${
                blink ? "opacity-60" : "opacity-100"
              }`}
            >
              <span className="font-bold text-[#FAFAFA] text-sm sm:text-base md:text-lg whitespace-nowrap">
                ${student.ticker}
              </span>
              <span
                className={`flex items-center gap-0.5 sm:gap-1 font-bold text-xs sm:text-sm md:text-base whitespace-nowrap ${
                  isPositive ? "text-[#00FF99]" : "text-[#FF4C4C]"
                }`}
              >
                {isPositive ? "↑" : "↓"}
                {isPositive ? "+" : ""}
                {student.dailyChange.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
          width: max-content;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default Scroller;
