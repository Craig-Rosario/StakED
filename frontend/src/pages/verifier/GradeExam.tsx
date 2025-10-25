import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { CheckCircle, AlertTriangle, Users, Trophy, DollarSign } from "lucide-react";

interface Student {
  _id: string;
  walletAddress: string;
  username: string;
}

interface Grade {
  studentAddress: string;
  studentName: string;
  score: number;
}

interface ExamInfo {
  _id: string;
  name: string;
  description: string;
  blockchainExamId: string;
  rewardsDistributed: boolean;
  status: string;
  classId: {
    name: string;
    students: Student[];
  };
  blockchain?: {
    totalStake: string;
    candidates: string[];
    finalized: boolean;
    stakingOpen: boolean;
  };
  stakes?: Array<{
    candidateAddress: string;
    candidateName: string;
    totalStaked: string;
  }>;
}

const GradeExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [rewardPreview, setRewardPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExamInfo();
  }, [examId]);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

  const fetchExamInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exam info');
      }

      const data = await response.json();
      if (data.success) {
        setExamInfo(data.exam);
        
        const students = data.exam.classId.students || [];
        const initialGrades = students
          .filter((student: Student) => student.walletAddress)
          .map((student: Student) => ({
            studentAddress: student.walletAddress,
            studentName: student.username || "Unknown",
            score: 0
          }));
        
        setGrades(initialGrades);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch exam info");
    } finally {
      setLoading(false);
    }
  };

  const updateGrade = (studentAddress: string, score: number) => {
    setGrades(prev => 
      prev.map(g => 
        g.studentAddress === studentAddress 
          ? { ...g, score: Math.max(0, Math.min(100, score)) }
          : g
      )
    );
  };

  const calculateRewardPreview = () => {
    if (!examInfo || !examInfo.blockchain) return null;

    const totalStaked = parseFloat(examInfo.blockchain.totalStake);
    const protocolFee = totalStaked * 0.025; // 2.5%
    
    // Winners are those who meet or exceed their predicted scores
    // For now, we'll estimate based on available data or mark as "TBD"
    const estimatedWinners = grades.filter(g => {
      // If we have prediction data from blockchain, use it
      // For now, assume average prediction of 70% for estimation
      const estimatedPrediction = 70; // This would come from blockchain in real implementation
      return g.score >= estimatedPrediction;
    });

    let scenario = "";
    let distribution = "";

    if (estimatedWinners.length === 0) {
      scenario = "Estimated: Nobody Meets Predictions";
      distribution = `Estimated: All ${totalStaked.toFixed(3)} PYUSD goes to Staked Bank`;
    } else if (estimatedWinners.length === grades.length) {
      scenario = "Estimated: Everyone Meets Predictions";
      distribution = "Estimated: Everyone gets their stake back (no redistribution)";
    } else {
      scenario = "Estimated: Mixed Results";
      distribution = `Estimated: Winners get proportional share of losers' stakes`;
    }

    return {
      scenario,
      distribution,
      totalStaked,
      protocolFee,
      winners: estimatedWinners.length,
      total: grades.length,
      note: "Final results depend on each student's actual predictions"
    };
  };

  const handleSubmitGrades = () => {
    if (grades.some(g => g.score < 0 || g.score > 100)) {
      setError("All scores must be between 0 and 100");
      return;
    }

    const preview = calculateRewardPreview();
    setRewardPreview(preview);
    setShowConfirmDialog(true);
  };

  const confirmSubmission = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/exams/submit-grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          examId,
          grades: grades.map(g => ({
            studentAddress: g.studentAddress,
            score: g.score
          }))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Grades submitted successfully!\n\nScenario: ${data.scenario}\nWinners: ${data.winners}/${data.totalStudents}\n\nRewards have been distributed on the blockchain.`);
        navigate('/verifier/dashboard');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit grades");
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading exam details...</div>
        </div>
      </div>
    );
  }

  if (error || !examInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-xl">{error || "Exam not found"}</p>
              <Button onClick={() => navigate('/verifier/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examInfo.rewardsDistributed) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-green-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-xl">Grades already submitted and rewards distributed</p>
              <p className="text-gray-600 mt-2">This exam has been finalized.</p>
              <Button onClick={() => navigate('/verifier/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const preview = calculateRewardPreview();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Grade Exam</h1>
        <p className="text-gray-600">{examInfo.name}</p>
      </div>

      {/* Exam Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold">{grades.length} Students</p>
                <p className="text-sm text-gray-600">Registered for exam</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold">{examInfo.blockchain?.totalStake || '0'} PYUSD</p>
                <p className="text-sm text-gray-600">Total staked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold">Prediction-Based</p>
                <p className="text-sm text-gray-600">Win if actual ≥ predicted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grading Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Student Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {grades.map((grade, index) => (
              <div key={grade.studentAddress} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{grade.studentName}</p>
                  <p className="text-sm text-gray-600">
                    {grade.studentAddress.slice(0, 10)}...{grade.studentAddress.slice(-8)}
                  </p>
                </div>
                <div className="w-32">
                  <Label htmlFor={`score-${index}`}>Score</Label>
                  <Input
                    id={`score-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    value={grade.score}
                    onChange={(e) => updateGrade(grade.studentAddress, parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
                <div className="w-20 text-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    Score: {grade.score}%
                  </span>
                  <div className="text-xs text-gray-500">
                    vs Prediction
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reward Preview */}
      {preview && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reward Distribution Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-lg">{preview.scenario}</p>
                  <p className="text-gray-600">{preview.distribution}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Winners: {preview.winners}/{preview.total}</p>
                  <p className="text-sm text-gray-600">Total Staked: {preview.totalStaked} PYUSD</p>
                  <p className="text-sm text-gray-600">Protocol Fee: {preview.protocolFee.toFixed(3)} PYUSD</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button 
          onClick={() => navigate('/verifier/dashboard')}
          className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmitGrades}
          disabled={submitting || grades.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Submit Grades & Distribute Rewards
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Grade Submission</DialogTitle>
            <DialogDescription>
              This will submit grades to the blockchain and automatically distribute rewards. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {rewardPreview && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2">{rewardPreview.scenario}</h4>
                <p className="text-gray-700 mb-2">{rewardPreview.distribution}</p>
                
                <div className="space-y-1 text-sm">
                  <p>• Winners: {rewardPreview.winners}/{rewardPreview.total} students</p>
                  <p>• Total Staked: {rewardPreview.totalStaked} PYUSD</p>
                  <p>• Protocol Fee: {rewardPreview.protocolFee.toFixed(3)} PYUSD</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={submitting}
                  className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmSubmission}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitting ? "Submitting..." : "Confirm & Submit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default GradeExam;