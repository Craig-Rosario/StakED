import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BookOpen, Users } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const JoinClass = () => {
  const [formData, setFormData] = useState({
    classCode: "",
    studentName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleJoinClass = async () => {
    try {
      setLoading(true);
      setMessage("");

      if (!formData.classCode || !formData.studentName) {
        setMessage("Please fill in all fields");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please login first");
        return;
      }

      const response = await fetch(`${API_BASE}/classes/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classCode: formData.classCode.toUpperCase(),
          studentName: formData.studentName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Successfully joined the class!");
        setFormData({ classCode: "", studentName: "" });
        // Optionally redirect to dashboard
        setTimeout(() => {
          window.location.href = "/student/dashboard";
        }, 2000);
      } else {
        setMessage(data.message || "Failed to join class");
      }
    } catch (error) {
      console.error("Error joining class:", error);
      setMessage("An error occurred while joining the class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2">
            Join a <span className="text-green-500">Class</span>
          </h1>
          <p className="font-mono text-gray-600">
            Enter your class code and name to get started
          </p>
        </div>

        <Card className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-8">
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 border-2 border-black rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Class Registration</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="uppercase text-xs font-bold text-gray-800 mb-2 block">
                  Your Name
                </Label>
                <Input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="bg-white border-2 border-black px-4 py-3 text-base"
                  disabled={loading}
                />
              </div>

              <div>
                <Label className="uppercase text-xs font-bold text-gray-800 mb-2 block">
                  Class Code
                </Label>
                <Input
                  type="text"
                  name="classCode"
                  value={formData.classCode}
                  onChange={handleInputChange}
                  placeholder="Enter class code (e.g., MTH101)"
                  className="bg-white border-2 border-black px-4 py-3 text-base uppercase"
                  disabled={loading}
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-4 border-2 border-black text-center font-bold ${
                  message.includes("Successfully")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message}
              </div>
            )}

            <Button
              onClick={handleJoinClass}
              disabled={loading || !formData.classCode || !formData.studentName}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Joining..." : "Join Class"}
            </Button>

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>Don't have a class code? Contact your instructor.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JoinClass;