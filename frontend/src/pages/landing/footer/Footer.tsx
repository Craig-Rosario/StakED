import { Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t-4 border-[#2a2a2a] bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#050505] text-white">
      <div className="max-w-9xl mx-auto">
        <div className="grid grid-cols-1 p-6 md:grid-cols-3 gap-6 items-center">
          {/* --- Left Section --- */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-2xl font-bold">
                Stak
                <span className="text-[#FF4C4C]">E</span>
                <span className="text-[#00FF99]">D</span>
              </h3>
            </div>
            <p className="font-mono text-sm font-bold text-[#e0e0e0]">
              Bet on yourself.
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Empowering confidence in you.
            </p>
          </div>

          {/* --- Center Links --- */}
          <div className="flex flex-wrap justify-center gap-6 font-bold text-sm">
            <a
              href="https://github.com/Craig-Rosario/StakED"
              className="text-gray-300 hover:text-[#00A2FF] transition-colors uppercase"
            >
              Docs
            </a>
            <a
              href="https://github.com/Craig-Rosario/StakED"
              className="text-gray-300 hover:text-[#00A2FF] transition-colors uppercase"
            >
              GitHub
            </a>
          </div>

          {/* --- Right Section (Icon) --- */}
          <div className="flex justify-center md:justify-end gap-4">
            <a
              href="https://github.com/Craig-Rosario/StakED"
              className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#444] bg-transparent hover:bg-[#1a1a1a] hover:border-[#00A2FF] transition-all"
            >
              <Github className="h-6 w-6 text-gray-200 hover:text-[#00A2FF] transition-colors" />
            </a>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="mt-8 p-6 border-t-4 border-[#2a2a2a] text-center">
          <p className="font-mono text-xs text-gray-500">
            © 2025 StakED. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
