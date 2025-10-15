import { useState } from "react";

const upcomingTests = [
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

const classmates = [
  { name: "Alex Chen", confidence: 92, status: "high" },
  { name: "Maya Rodriguez", confidence: 78, status: "medium" },
  { name: "Jordan Smith", confidence: 65, status: "medium" },
  { name: "Taylor Kim", confidence: 88, status: "high" },
  { name: "Riley Patel", confidence: 71, status: "medium" }
];

const NeoButton = ({ children, onClick, className = "", variant = "primary" }) => {
  const baseClasses = "font-extrabold border-2 border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none";
  
  const variants = {
    primary: "bg-black text-white shadow-[4px_4px_0px_#000000] hover:bg-white hover:text-black",
    secondary: "bg-white text-black shadow-[4px_4px_0px_#000000] hover:bg-black hover:text-white",
    danger: "bg-red-500 text-white shadow-[4px_4px_0px_#000000] hover:bg-white hover:text-red-500"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default function UpcomingTestsDashboard() {
  const [selectedTest, setSelectedTest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [confidence, setConfidence] = useState(85);
  const [stakeAmount, setStakeAmount] = useState(100);
  
  const handleTestSelect = (test) => {
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

  const handleStakeSubmit = (e) => {
    e.preventDefault();
    console.log(`Staking ${stakeAmount} SSTKD with ${confidence}% confidence`);
    closeStakeModal();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className={`p-4 sm:p-6 transition-all duration-300 ${showModal || showStakeModal ? 'blur-md' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold">
              <span className="text-black">Stak</span>
              <span className="text-red-500">E</span>
              <span className="text-green-500">D</span>
            </h1>
            <p className="font-mono text-gray-600 mt-1">Student Confidence Market</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Upcoming Tests</h2>
                
                <div className="space-y-4">
                  {upcomingTests.map((test) => (
                    <div 
                      key={test.id}
                      className="border-4 border-black p-4 bg-white shadow-[6px_6px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
                      onClick={() => handleTestSelect(test)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-extrabold text-gray-800">{test.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{test.subtitle}</p>
                          <p className="text-xs font-mono mt-2 bg-gray-100 inline-block px-2 py-1 border border-black">
                            {test.timeLeft}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center" 
                               style={{ backgroundColor: `${test.color}30` }}>
                            <span className="font-bold">{test.confidence}%</span>
                          </div>
                          <p className="text-xs mt-1 font-mono">{test.stakes} stakes</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>Confidence Level</span>
                          <span>{test.confidence}%</span>
                        </div>
                        <div className="h-3 border-2 border-black bg-gray-100 overflow-hidden">
                          <div 
                            className="h-full" 
                            style={{ 
                              width: `${test.confidence}%`, 
                              backgroundColor: test.color 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <NeoButton 
                        className="w-full py-2 mt-4 text-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestSelect(test);
                        }}
                      >
                        STAKE NOW
                      </NeoButton>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Classmates</h2>
              
              <div className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] p-4">
                <div className="space-y-3">
                  {classmates.map((classmate, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border-2 border-black bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-800">{classmate.name}</p>
                        <p className="text-xs text-gray-600">Confidence: {classmate.confidence}%</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full border border-black ${
                        classmate.status === 'high' ? 'bg-green-500' : 
                        classmate.status === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 border-2 border-black bg-gray-100">
                  <p className="text-sm font-bold text-gray-700">Class Avg: 78.8%</p>
                  <p className="text-xs text-gray-600">Your rank: #2</p>
                </div>
              </div>

              <div className="mt-8 border-4 border-black p-4 bg-white shadow-[6px_6px_0px_#000000]">
                <h3 className="font-extrabold text-gray-800 mb-3">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Stakes</span>
                    <span className="font-bold">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Results</span>
                    <span className="font-bold">2</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Earnings</span>
                    <span className="font-bold text-green-600">+245 SSTKD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedTest && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black p-6 max-w-2xl w-full shadow-[12px_12px_0px_#000000] relative">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-2"># {selectedTest.title}</h1>
                <p className="text-lg text-gray-600 font-mono">{selectedTest.subtitle}</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-right">
                  <div className="text-3xl font-extrabold" style={{ color: selectedTest.color }}>
                    {selectedTest.confidence}%
                  </div>
                  <p className="text-xs font-mono">Your Confidence</p>
                </div>
                <button 
                  onClick={closeModal}
                  className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center font-bold hover:bg-black hover:text-white transition-colors flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{selectedTest.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-bold text-gray-600 mb-1">TIME LEFT</p>
                <p className="text-lg font-extrabold">{selectedTest.timeLeft}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-1">TOTAL STAKES</p>
                <p className="text-lg font-extrabold">{selectedTest.stakes}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-1">DIFFICULTY</p>
                <p className="text-lg font-extrabold">{selectedTest.difficulty}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-1">STUDY TIME</p>
                <p className="text-lg font-extrabold">{selectedTest.studyTime}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-gray-800 mb-4">Key Topics</h2>
              <div className="grid grid-cols-2 gap-2">
                {selectedTest.topics.map((topic, index) => (
                  <div key={index} className="border border-black p-2 bg-white text-center">
                    <span className="text-gray-700 font-medium text-sm">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <NeoButton 
              onClick={openStakeModal}
              className="w-full py-4 text-xl mt-6"
            >
              PLACE YOUR STAKE
            </NeoButton>
          </div>
        </div>
      )}

      {showStakeModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[12px_12px_0px_#000000] relative">
            <button 
              onClick={closeStakeModal}
              className="absolute top-4 right-4 w-8 h-8 border-2 border-black bg-white flex items-center justify-center font-bold hover:bg-black hover:text-white transition-colors"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Stake Your Confidence</h2>
            <p className="text-gray-600 mb-6">Place your stake for {selectedTest?.title}</p>
            
            <form onSubmit={handleStakeSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  How much do you think you'll score(%)? 
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full border-4 border-black p-3 text-lg font-bold text-center bg-white focus:outline-none focus:border-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Amount to Stake (ETH)
                </label>
                <input
                  type="number"
                  min="1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  className="w-full border-4 border-black p-3 text-lg font-bold text-center bg-white focus:outline-none focus:border-gray-500"
                />
              </div>
              
              <NeoButton
                type="submit"
                variant="danger"
                className="w-full py-4 text-xl"
              >
                CONFIRM STAKE
              </NeoButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}