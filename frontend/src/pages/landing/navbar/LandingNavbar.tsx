import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Blocks, CircleHelp, Home, Wallet } from "lucide-react";

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  };

  return (
    <nav className="w-full border-b-4 border-foreground bg-card z-50 top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => scrollToSection("home")}
        >
          <h1 className="text-2xl font-extrabold tracking-tight">
            Stak<span className="text-[#FF4C4C]">E</span><span className="text-[#01a72a]">D</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button
            className="flex items-center gap-2 bg-white hover:bg-[#fef3c7] border-4 border-black font-bold rounded-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            onClick={() => scrollToSection("home")}
          >
            <Home className="w-4 h-4" /> Home
          </Button>
          <Button
            className="flex items-center gap-2 bg-white border-4 border-black font-bold rounded-md hover:bg-[#fef3c7] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          // onClick={() => scrollToSection("features")}
          >
            <Blocks className="w-4 h-4" /> Features
          </Button>
          <Button
            className="flex items-center gap-2 bg-white hover:bg-[#fef3c7] border-4 border-black font-bold rounded-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          // onClick={() => scrollToSection("faq")}
          >
            <CircleHelp className="w-4 h-4" /> FAQ
          </Button>
        </div>

        <Button
          className="hidden md:flex bg-[#00A2FF] text-white border-4 border-black font-bold uppercase rounded-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        // onClick={() => handleNavigate("login")}
        >
          <Wallet className="w-4 h-4" />Connect Wallet
        </Button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 border-2 border-black rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-card border-t-4 border-black flex flex-col items-start px-6 py-4 gap-3">
          <Button
            className="w-full bg-white border-4 border-black font-bold uppercase rounded-md hover:bg-[#e0f7ff]"
            onClick={() => scrollToSection("home")}
          >
            Home
          </Button>
          <Button
            className="w-full bg-white border-4 border-black font-bold uppercase rounded-md hover:bg-[#e0f7ff]"
          // onClick={() => handleNavigate("leaderboard")}
          >
            Features
          </Button>
          <Button
            className="w-full bg-white border-4 border-black font-bold uppercase rounded-md hover:bg-[#e0f7ff]"
          // onClick={() => handleNavigate("portfolio")}
          >
            FAQ
          </Button>

          <Button
            className="w-full bg-[#00A2FF] text-white border-4 border-black font-bold uppercase rounded-md"
          // onClick={() => handleNavigate("login")}
          >
            Connect Wallet
          </Button>
        </div>
      )}
    </nav>
  );
}
