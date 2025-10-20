import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Class {
  _id: string;
  name: string;
  code: string;
  students: Array<{
    _id: string;
    username: string;
    walletAddress: string;
  }>;
}

const CreateExam: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const getTestTimes = () => {
    const now = new Date();
    const examDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); 
    const stakeDeadline = new Date(now.getTime() + 1 * 60 * 60 * 1000); 
    
    return {
      examDate: examDate.toISOString().slice(0, 16),
      stakeDeadline: stakeDeadline.toISOString().slice(0, 16)
    };
  };

  const testTimes = getTestTimes();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    classId: "",
    examDate: testTimes.examDate,
    stakeDeadline: testTimes.stakeDeadline,
    maxMarks: 100
  });

  useEffect(() => {
    fetchVerifierClasses();
  }, []);

  const fetchVerifierClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/classes/verifier', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { name, classId, examDate, stakeDeadline, maxMarks } = formData;
    
    if (!name.trim()) {
      alert("Please enter exam name");
      return false;
    }
    
    if (!classId) {
      alert("Please select a class");
      return false;
    }
    
    if (!examDate) {
      alert("Please set exam date");
      return false;
    }
    
    if (!stakeDeadline) {
      alert("Please set stake deadline");
      return false;
    }

    const examDateTime = new Date(examDate);
    const stakeDateTime = new Date(stakeDeadline);

    if (stakeDateTime >= examDateTime) {
      alert("Stake deadline must be before exam date");
      return false;
    }

    if (maxMarks <= 0) {
      alert("Maximum marks must be greater than 0");
      return false;
    }

    // Passing score validation removed - winners determined by prediction accuracy

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/exams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Exam "${data.exam.name}" created successfully!\n\nStudents: ${data.studentsCount} total (${data.studentsWithWallets} have wallets)\nBlockchain will activate when first student stakes.`);
        navigate('/verifier/dashboard');
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      alert(`❌ Failed to create exam: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClass = classes.find(c => c._id === formData.classId);
  const studentsWithWallets = selectedClass?.students.filter(s => s.walletAddress) || [];
  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        <div className="lg:col-span-2 space-y-6">
          <div className="mb-1 flex justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
                Create New Exam
              </h1>
              <p className="font-mono text-gray-600 mt-1 mb-6">
                Create exam - blockchain staking activates when students begin staking
              </p>
              <button
                type="button"
                onClick={() => {
                  const newTestTimes = getTestTimes();
                  setFormData(prev => ({
                    ...prev,
                    name: "Test Exam - " + new Date().toLocaleTimeString(),
                    description: "This is a test exam for blockchain staking functionality",
                    examDate: newTestTimes.examDate,
                    stakeDeadline: newTestTimes.stakeDeadline
                  }));
                }}
                className="mb-4 px-4 py-2 bg-green-500 text-white border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-sm font-bold"
              >
                🚀 Fill Test Data
              </button>
            </div>
          </div>

          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                  Select Class
                </Label>
                <select 
                  value={formData.classId}
                  onChange={(e) => handleInputChange('classId', e.target.value)}
                  className="w-full bg-white border-2 border-black text-[#0A0A0A] px-4 py-3 focus:border-[#00A2FF] focus:outline-none"
                  required
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.code}) - {cls.students.length} students
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                  Exam Title
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Midterm Examination"
                  className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#0A0A0A] mb-2 uppercase text-xs font-bold tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Exam Date & Time
                  </Label>
                  <input
                    type="datetime-local"
                    value={formData.examDate}
                    onChange={(e) => handleInputChange('examDate', e.target.value)}
                    className="w-full bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3 rounded-none font-mono"
                    style={{
                      colorScheme: 'light',
                      height: '48px',
                      fontSize: '14px'
                    }}
                    min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">📅 Select future date and time for exam</p>
                </div>
                <div>
                  <Label className="text-[#0A0A0A] mb-2 uppercase text-xs font-bold tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Staking Deadline
                  </Label>
                  <input
                    type="datetime-local"
                    value={formData.stakeDeadline}
                    onChange={(e) => handleInputChange('stakeDeadline', e.target.value)}
                    className="w-full bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3 rounded-none font-mono"
                    style={{
                      colorScheme: 'light',
                      height: '48px',
                      fontSize: '14px'
                    }}
                    min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)}
                    max={formData.examDate || undefined}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">⏰ Must be before exam date (students stake before exam)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                    Maximum Marks
                  </Label>
                  <Input
                    type="number"
                    value={formData.maxMarks}
                    onChange={(e) => handleInputChange('maxMarks', parseInt(e.target.value) || 100)}
                    min="1"
                    className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3"
                  />
                </div>

                {/* Passing score removed - winners determined by prediction accuracy */}
              </div>

              <div>
                <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                  Description
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter exam details and instructions..."
                  rows={4}
                  className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3 resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting || loading}
                className="w-full px-6 py-4 bg-[#00A2FF] text-white border-2 border-black shadow-[6px_6px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-wider font-black disabled:opacity-50"
              >
                <FileText className="inline w-5 h-5 mr-2" />
                {submitting ? "Creating..." : "Create Exam"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {/* Selected Class Info */}
          {selectedClass && (
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-6">
              <h3 className="text-xl font-extrabold text-gray-800 mb-4">Selected Class</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedClass.name}</p>
                <p><strong>Code:</strong> {selectedClass.code}</p>
                <p><strong>Total Students:</strong> {selectedClass.students.length}</p>
                <p><strong>Students with Wallets:</strong> {studentsWithWallets.length}</p>
              </div>
              
              {studentsWithWallets.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-green-600">
                    ✅ Ready for blockchain staking
                  </p>
                </div>
              )}
              
              {studentsWithWallets.length === 0 && selectedClass.students.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-orange-600">
                    ⚠️ No students have connected wallets yet
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Blockchain Details */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-6">
            <h3 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Staking Details
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>Network:</strong> Sepolia Testnet</p>
              <p><strong>PYUSD Token:</strong> 0xCaC5...bB9</p>
              <p><strong>Protocol Fee:</strong> 2.5%</p>
              <p className="text-blue-600 font-bold">🔗 Blockchain activated when first student stakes</p>
              <p className="text-green-600 font-bold">✅ Any verifier can grade any exam</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-6">
            <h3 className="text-xl font-extrabold text-gray-800 mb-4">How It Works</h3>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Create Exam:</strong> Normal exam creation (fast)</p>
              <p>2. <strong>First Stake:</strong> Blockchain automatically initialized</p>
              <p>3. <strong>Students Stake:</strong> PYUSD with predicted marks</p>
              <p>4. <strong>Grade & Reward:</strong> Automatic distribution based on performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;
