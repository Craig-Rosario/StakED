import { useState } from "react";
import { Button } from "@/components/ui/button";



interface Student {
  _id: string;
  username: string;
  walletAddress: string;
}

interface GradingDialogProps {
  examId: string;
  examName: string;
  students: Student[];
  onClose?: () => void;
  onGraded?: () => void;
}

const GradingDialog: React.FC<GradingDialogProps> = ({
  examId,
  examName,
  students,
  onClose,
  onGraded
}) => {
  const [marks, setMarks] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    students.forEach(student => {
      initial[student._id] = 0;
    });
    return initial;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [gradedStudents, setGradedStudents] = useState<Set<string>>(new Set());
  const [submitMessage, setSubmitMessage] = useState<string>('');

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value);
    setMarks(prev => ({
      ...prev,
      [studentId]: isNaN(numValue) ? 0 : numValue
    }));

    // Mark student as graded when they receive a mark > 0
    if (numValue > 0) {
      setGradedStudents(prev => new Set(prev).add(studentId));
    } else {
      setGradedStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  const handleSubmitGrades = async () => {
    try {
      setIsLoading(true);
      setSubmitMessage('Processing grades...');

      setSubmitMessage('Submitting grades and distributing PYUSD rewards...');
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/exams/submit-grades`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId,
          grades: students.map((s) => ({
            studentAddress: s.walletAddress,
            score: marks[s._id] || 0,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitMessage(`❌ Error: ${result.message}`);
        return;
      }

      // Backend handles both database and blockchain automatically
      setSubmitMessage(`🎉 Success! ${result.scenario || 'Grades submitted'} - Winners: ${result.winners || 0}/${result.totalStudents || students.length}. PYUSD rewards distributed!`);

      setTimeout(() => {
        onGraded?.();
        onClose?.();
      }, 3000);

    } catch (error) {
      console.error('Error submitting grades:', error);
      setSubmitMessage('❌ Failed to submit grades. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWinners = () => {
    const maxMark = Math.max(...Object.values(marks));
    return students.filter(student => marks[student._id] === maxMark);
  };

  const winners = calculateWinners();

  return (
    <div className="flex flex-col max-h-[80vh] overflow-hidden">
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-xl font-bold mb-2">Grade Exam: {examName}</h3>
        <p className="text-gray-600">
          Enter marks for each student. Winners will be determined by highest marks.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {students.map((student) => {
          const isGraded = gradedStudents.has(student._id);
          const studentMark = marks[student._id] || 0;

          return (
            <div
              key={student._id}
              className={`flex items-center justify-between p-3 border-2 rounded transition-colors ${isGraded
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
                }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold truncate">{student.username}</p>
                  {isGraded && <span className="text-green-600 text-sm">✓ Graded</span>}
                </div>
                <p className="text-xs text-gray-600 font-mono truncate">{student.walletAddress}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="text-sm font-bold">Marks:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={studentMark}
                  onChange={(e) => handleMarkChange(student._id, e.target.value)}
                  className={`w-20 border-2 p-2 text-center font-bold rounded ${isGraded ? 'border-green-400 bg-green-50' : 'border-black'
                    }`}
                  disabled={isLoading}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      {gradedStudents.size > 0 && (
        <div className="flex-shrink-0 bg-blue-50 border-2 border-blue-200 p-3 rounded">
          <p className="text-blue-800 font-medium">
            Progress: {gradedStudents.size} of {students.length} students graded
          </p>
        </div>
      )}

      {/* Submit message */}
      {submitMessage && (
        <div className="flex-shrink-0 bg-gray-50 border-2 border-gray-200 p-3 rounded">
          <p className="text-gray-800 font-medium">{submitMessage}</p>
        </div>
      )}

      {winners.length > 0 && (
        <div className="flex-shrink-0 bg-green-50 border-2 border-green-200 p-3 rounded mt-4">
          <h4 className="font-bold text-green-800 mb-2">
            Current Winners (Highest Marks: {Math.max(...Object.values(marks))}):
          </h4>
          <ul className="text-green-700">
            {winners.map(winner => (
              <li key={winner._id}>• {winner.username}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-4 pt-4 border-t flex-shrink-0">
        <Button
          onClick={onClose}
          className="flex-1 bg-gray-500 text-white"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmitGrades}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Grades'}
        </Button>
      </div>
    </div>
  );
};

export default GradingDialog;