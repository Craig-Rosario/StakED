import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, FileText, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const IntegratedCreateExam: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    classId: "",
    examDate: "",
    stakeDeadline: "",
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
      alert("Max marks must be greater than 0");
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
        alert(`✅ Exam created successfully!\n\nBlockchain Integration: ${data.exam.blockchainCreated ? 'Enabled' : 'Failed'}\nStaking starts immediately for students.`);
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
      <style>{`
        /* Ensure datetime-local inputs show calendar picker properly */
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="%23374151" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>');
          cursor: pointer;
          font-size: 16px;
          width: 20px;
          height: 20px;
          padding: 0;
          margin-left: 8px;
        }
        
        input[type="datetime-local"] {
          position: relative;
          min-height: 44px;
        }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
              Create New Exam with Blockchain Staking
            </h1>
            <p className="font-mono text-gray-600 mt-1 mb-6">
              Create exam with integrated PYUSD staking for students
            </p>
          </div>

          <Card className="border-4 border-black shadow-[8px_8px_0px_#000]">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Class Selection */}
                <div>
                  <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                    Select Class
                  </Label>
                  <select 
                    value={formData.classId}
                    onChange={(e) => handleInputChange('classId', e.target.value)}
                    className="w-full bg-white border-2 border-black text-[#0A0A0A] px-4 py-3 focus:border-[#00A2FF] focus:outline-none"
                    disabled={loading}
                  >
                    <option value="">Select a class...</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} ({cls.code}) - {cls.students.length} students
                      </option>
                    ))}
                  </select>
                  {loading && <p className="text-xs text-gray-500 mt-1">Loading classes...</p>}
                </div>

                {/* Exam Title */}
                <div>
                  <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                    Exam Title
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Midterm Examination"
                    className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Exam details, topics covered, etc."
                    className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3 min-h-[100px]"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                      📅 Exam Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.examDate}
                      onChange={(e) => handleInputChange('examDate', e.target.value)}
                      className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3 cursor-pointer hover:border-[#00A2FF] transition-colors"
                      style={{
                        colorScheme: 'light',
                        WebkitAppearance: 'none'
                      }}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">📝 Click to select exam date and time</p>
                  </div>
                  
                  <div>
                    <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                      ⏰ Stake Deadline
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.stakeDeadline}
                      onChange={(e) => handleInputChange('stakeDeadline', e.target.value)}
                      className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3 cursor-pointer hover:border-[#00A2FF] transition-colors"
                      style={{
                        colorScheme: 'light',
                        WebkitAppearance: 'none'
                      }}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">🎯 When staking closes (must be before exam)</p>
                  </div>
                </div>

                {/* Scoring */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button"
                    onClick={() => navigate('/verifier/dashboard')}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={submitting || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  >
                    {submitting ? "Creating..." : "Create Exam with Blockchain"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Class Preview */}
          {selectedClass && (
            <Card className="border-4 border-black shadow-[8px_8px_0px_#000]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Selected Class</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">{selectedClass.name}</p>
                    <p className="text-sm text-gray-600">Code: {selectedClass.code}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">Blockchain Eligibility:</p>
                    <p className="text-sm">
                      ✅ {studentsWithWallets.length} students with wallets<br/>
                      {selectedClass.students.length - studentsWithWallets.length > 0 && (
                        <>⚠️ {selectedClass.students.length - studentsWithWallets.length} students need wallets</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blockchain Info */}
          <Card className="border-4 border-black shadow-[8px_8px_0px_#000]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Blockchain Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-medium text-blue-800">PYUSD Staking System</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 mt-1">
                    <li>Students stake PYUSD on themselves or others</li>
                    <li>Automatic reward distribution after grading</li>
                    <li>2.5% protocol fee on stakes</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">Reward Rules:</p>
                  <ul className="text-xs space-y-1">
                    <li>🏆 <strong>Everyone passes:</strong> Everyone gets stake back</li>
                    <li>❌ <strong>Nobody passes:</strong> Stakes → Staked Bank</li>
                    <li>🎯 <strong>Mixed results:</strong> Winners take all</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Info */}
          <Card className="border-4 border-black shadow-[8px_8px_0px_#000]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Contract Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <p><strong>Network:</strong> Sepolia Testnet</p>
                <p><strong>PYUSD:</strong> 0xCaC5...bB9</p>
                <p><strong>ExamStaking:</strong> 0x183d...ce9 (Multi-verifier)</p>
                <p><strong>Protocol Fee:</strong> 2.5%</p>
                <p className="text-green-600 font-bold">✅ Any verifier can grade any exam</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntegratedCreateExam;