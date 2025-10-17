import { Plus, Users, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const VerifierClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [newClass, setNewClass] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setClasses(data.classes);
        } else {
          console.error("Failed to load classes:", data.message);
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };
    fetchClasses();
  }, []);

  const handleCreateClass = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClass),
      });

      const data = await res.json();
      if (data.success) {
        setClasses((prev) => [data.class, ...prev]);
        setNewClass({ name: "", code: "", description: "" });
        alert("Class created successfully!");
      } else {
        alert(`${data.message || "Error creating class"}`);
      }
    } catch (err) {
      console.error("Error creating class:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
            My Classes
          </h1>
          <p className="font-mono text-gray-600 mt-1 mb-4 sm:mb-0">
            Manage your courses, students & exams.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-[#00A2FF] text-white px-5 sm:px-6 py-3 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer rounded-md shadow-md">
              <Plus className="w-5 h-5" /> Create New Class
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[90vw] sm:w-[80vw] md:max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-6 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-black text-center uppercase">
                Create New Class
              </DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div>
                <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">
                  Class Name
                </Label>
                <Input
                  value={newClass.name}
                  onChange={(e) =>
                    setNewClass({ ...newClass, name: e.target.value })
                  }
                  placeholder="e.g., Advanced Mathematics"
                  className="bg-white border-2 border-black px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">
                  Class Code
                </Label>
                <Input
                  value={newClass.code}
                  onChange={(e) =>
                    setNewClass({ ...newClass, code: e.target.value })
                  }
                  placeholder="Unique Code (e.g., MTH101)"
                  className="bg-white border-2 border-black    px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div>
                <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">
                  Description
                </Label>
                <Input
                  value={newClass.description}
                  onChange={(e) =>
                    setNewClass({ ...newClass, description: e.target.value })
                  }
                  placeholder="Brief description of the class"
                  className="bg-white border-2  px-3 py-2 text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">

                <button
                  onClick={handleCreateClass}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-[#00A2FF] text-white border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-md disabled:opacity-50 text-sm sm:text-base font-semibold cursor-pointer"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <div
              key={cls._id}
              className="bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] p-5 flex flex-col justify-between transition-transform hover:translate-y-[-3px]"
            >
              <div>
                <h3 className="text-lg sm:text-xl font-black uppercase mb-2">
                  {cls.name}
                </h3>
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00A2FF]" />{" "}
                    {cls.students?.length || 0} Students
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#00FF99]" /> {cls.exams?.length || 0} Exams
                  </span>
                </div>
              </div>

              <div className="flex justify-between mt-3">
                <Button
                  className="bg-[#00FF99] text-black px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer rounded-md w-full sm:w-auto"
                  onClick={() => navigate(`/verifier/classes/${cls._id}`)} // ✅ fixed
                >
                  View
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center col-span-3">No classes created yet.</p>
        )}
      </section>

    </div>
  );
};

export default VerifierClasses;
