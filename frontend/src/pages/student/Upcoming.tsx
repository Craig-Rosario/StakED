import { useState } from "react";
import { Button } from "@/components/ui/button";
import StakeDialogContent from "@/components/custom/StakeDialogContent";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface Test {
  id: number;
  title: string;
  subtitle: string;
  timeLeft: string;
  confidence: number;
  stakes: number;
  color: string;
  description: string;
  topics: string[];
  difficulty: string;
  studyTime: string;
}

interface NeoButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit" | "reset";
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: number;
  className?: string;
}

const upcomingTests: Test[] = [
  {
    id: 1,
    title: "Math Midterm",
    subtitle: "Calculus II - Advanced Integration",
    timeLeft: "2d 5h left to stake",
    confidence: 78,
    stakes: 42,
    color: "#FF6B6B",
    description: "Covering advanced integration techniques including trigonometric substitution, partial fractions, and improper integrals. Focus on applications in physics and engineering.",
    topics: ["Integration by Parts", "Trig Substitution", "Partial Fractions", "Improper Integrals"],
    difficulty: "High",
    studyTime: "12+ hours"
  },
  {
    id: 2,
    title: "Physics Final",
    subtitle: "Quantum Mechanics - Wave Functions",
    timeLeft: "5d 12h left to stake",
    confidence: 65,
    stakes: 28,
    color: "#4ECDC4",
    description: "Comprehensive final covering wave functions, Schrödinger equation, and quantum harmonic oscillator. Emphasis on mathematical foundations and physical interpretations.",
    topics: ["Wave Functions", "Schrödinger Equation", "Quantum States", "Probability Density"],
    difficulty: "Very High",
    studyTime: "15+ hours"
  }
];

const NeoButton: React.FC<NeoButtonProps> = ({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary",
  type = "button"
}) => {
  const baseClasses = "font-extrabold border-2 border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none";
  
  const variants = {
    primary: "bg-black text-white shadow-[4px_4px_0px_#000000] hover:bg-white hover:text-black",
    secondary: "bg-white text-black shadow-[4px_4px_0px_#000000] hover:bg-black hover:text-white",
    danger: "bg-red-500 text-white shadow-[4px_4px_0px_#000000] hover:bg-white hover:text-red-500"
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend, className = "" }) => {
  const isGoodTrend = title === "Pending Results" ? trend < 0 : trend > 0;
  const isBadTrend = title === "Pending Results" ? trend > 0 : trend < 0;

  const getTrendColor = () => {
    if (trend === 0) return "text-gray-600";
    if (isGoodTrend) return "text-green-600";
    if (isBadTrend) return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = () => {
    if (trend === 0) return "→";
    if (isGoodTrend) return "↑";
    if (isBadTrend) return "↓";
    return "→";
  };

  return (
    <div className={`border-2 border-black bg-white p-4 ${className}`}>
      <div className="text-center mb-3">
        <h3 className="font-extrabold text-gray-600 text-xs uppercase tracking-wide mb-2">{title}</h3>
        <div className={`text-sm font-bold ${getTrendColor()}`}>
          {getTrendIcon()} {Math.abs(trend)}%
        </div>
      </div>
      <div className="text-center">
        <p className="text-2xl font-extrabold text-gray-800 mb-1">{value}</p>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{subtitle}</p>
      </div>
    </div>
  );
};

export default function UpcomingTestsDashboard() {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  
  const handleTestSelect = (test: Test) => {
    setSelectedTest(test);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTest(null);
  };

  const openStakeModal = () => {
    setShowModal(false);
    setShowStakeModal(true);
  };

  const closeStakeModal = () => {
    setShowStakeModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
                <span className="text-black">Upcoming</span>
                <span className="text-green-500">Tests</span>
              </h1>
              
              <p className="font-mono text-gray-600 mt-1 text-sm sm:text-base">Monitor your metrics. Make your move.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="lg:col-span-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-4 sm:mb-6">Upcoming Tests</h2>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {upcomingTests.map((test) => (
                      <div 
                        key={test.id}
                        className="border-4 border-black p-3 sm:p-4 bg-white shadow-[6px_6px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
                        onClick={() => handleTestSelect(test)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 break-words">{test.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{test.subtitle}</p>
                            <p className="text-xs font-mono mt-2 bg-gray-100 inline-block px-2 py-1 border border-black">
                              {test.timeLeft}
                            </p>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-black flex items-center justify-center" 
                                 style={{ backgroundColor: `${test.color}30` }}>
                              <span className="font-bold text-sm sm:text-base">{test.confidence}%</span>
                            </div>
                            <p className="text-xs mt-1 font-mono">{test.stakes} stakes</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-4">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span>Confidence Level</span>
                            <span>{test.confidence}%</span>
                          </div>
                          <div className="h-2 sm:h-3 border-2 border-black bg-gray-100 overflow-hidden">
                            <div 
                              className="h-full" 
                              style={{ 
                                width: `${test.confidence}%`, 
                                backgroundColor: test.color 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full py-2 mt-3 sm:mt-4 text-sm sm:text-lg text-black bg-white cursor-pointer"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleTestSelect(test);
                          }}
                        >
                          STAKE NOW
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-4 sm:mb-6">Your Stats</h2>
                
                <div className="border-4 border-black p-4 sm:p-6 bg-white shadow-[6px_6px_0px_#000000]">
                  <h3 className="font-extrabold text-gray-800 mb-6 text-lg sm:text-xl text-center">Performance Overview</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <StatCard 
                      title="Active Stakes" 
                      value="5" 
                      subtitle="Active Tests"
                      trend={12}
                      className="bg-blue-50"
                    />
                    <StatCard 
                      title="Pending Results" 
                      value="2" 
                      subtitle="Awaiting"
                      trend={5}
                      className="bg-yellow-50"
                    />
                    <StatCard 
                      title="Total Earnings" 
                      value="+245" 
                      subtitle="ETH Earned"
                      trend={18}
                      className="bg-green-50"
                    />
                    <StatCard 
                      title="Win Rate" 
                      value="84%" 
                      subtitle="Accuracy Rate"
                      trend={3}
                      className="bg-purple-50"
                    />
                  </div>

                  <div className="mb-6">
                    <h4 className="font-extrabold text-gray-800 mb-4 text-sm sm:text-base text-center">Recent Activity</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border-2 border-black bg-gray-50">
                        <div className="text-left">
                          <p className="font-bold text-sm">Math Quiz</p>
                          <p className="text-xs text-gray-600">Staked 50 ETH</p>
                        </div>
                        <span className="text-green-600 font-bold text-sm">+25 ETH</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border-2 border-black bg-gray-50">
                        <div className="text-left">
                          <p className="font-bold text-sm">Physics Lab</p>
                          <p className="text-xs text-gray-600">Staked 30 ETH</p>
                        </div>
                        <span className="text-green-600 font-bold text-sm">+15 ETH</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border-2 border-black bg-gray-50">
                        <div className="text-left">
                          <p className="font-bold text-sm">Chem Final</p>
                          <p className="text-xs text-gray-600">Pending result</p>
                        </div>
                        <span className="text-yellow-600 font-bold text-sm">⏳</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-2 border-black bg-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-700">Overall Rank:</span>
                      <span className="text-sm font-extrabold">#2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-700">Total Staked:</span>
                      <span className="text-sm font-extrabold">180 ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedTest && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" />
          
          <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white border-4 border-black p-4 sm:p-6 max-w-2xl w-full shadow-[12px_12px_0px_#000000] relative mx-auto">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className="flex-1 pr-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2"># {selectedTest.title}</h1>
                  <p className="text-base sm:text-lg text-gray-600 font-mono">{selectedTest.subtitle}</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-4">
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: selectedTest.color }}>
                      {selectedTest.confidence}%
                    </div>
                    <p className="text-xs font-mono">Your Confidence</p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-black bg-white flex items-center justify-center font-bold hover:bg-black hover:text-white transition-colors flex-shrink-0 text-sm sm:text-base cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="mb-4 sm:mb-6">
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{selectedTest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-600 mb-1">TIME LEFT</p>
                  <p className="text-base sm:text-lg font-extrabold">{selectedTest.timeLeft}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-600 mb-1">TOTAL STAKES</p>
                  <p className="text-base sm:text-lg font-extrabold">{selectedTest.stakes}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-600 mb-1">DIFFICULTY</p>
                  <p className="text-base sm:text-lg font-extrabold">{selectedTest.difficulty}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-600 mb-1">STUDY TIME</p>
                  <p className="text-base sm:text-lg font-extrabold">{selectedTest.studyTime}</p>
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 mb-3 sm:mb-4">Key Topics</h2>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTest.topics.map((topic, index) => (
                    <div key={index} className="border border-black p-1 sm:p-2 bg-white text-center">
                      <span className="text-gray-700 font-medium text-xs sm:text-sm">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <NeoButton 
                onClick={openStakeModal}
                className="w-full py-3 sm:py-4 text-lg sm:text-xl mt-4 sm:mt-6 cursor-pointer"
              >
                PLACE YOUR STAKE
              </NeoButton>
            </div>
          </div>
        </>
      )}

      <Dialog open={showStakeModal} onOpenChange={(isOpen) => { if (!isOpen) closeStakeModal(); }}>
        <DialogContent className="w-[95vw] max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_#000000] rounded-none p-6">
          <StakeDialogContent stakeTargetName={selectedTest?.title || 'this test'} isSelfStake={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}