import { Github } from "lucide-react";

const Footer = () => {

  return (
    <footer className="border-t-4 border-black bg-[#F9F9F9]">
      <div className="max-w-9xl  mx-auto">
        <div className="grid grid-cols-1 p-6 md:grid-cols-3 gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-2xl font-bold uppercase">
                STAK<span className="text-[#00A2FF]">ED</span>
              </h3>
            </div>
            <p className="font-mono text-sm font-bold text-[#111]">
              Bet on yourself.
            </p>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Empowering confidence in you.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 font-bold text-sm">
            <a
              href="https://github.com/Craig-Rosario/StakED"
              className="hover:text-[#00A2FF] transition-colors uppercase"
            >
              Docs
            </a>
            <a
              href="https://github.com/Craig-Rosario/StakED"
              className="hover:text-[#00A2FF] transition-colors uppercase"
            >
              GitHub
            </a>
          </div>

          <div className="flex justify-center md:justify-end gap-4">
            <a
              href="https://github.com/Craig-Rosario/StakED"
              className="flex h-12 w-12 items-center justify-center rounded-lg border-3 border-black bg-transparent hover:bg-[#e5e5e5] transition-all"
            >
              <Github className="h-6 w-6 text-black" />
            </a>
          </div>
        </div>

        <div className="mt-8 p-6 border-t-4 border-black text-center">
          <p className="font-mono text-xs text-gray-700">
            © 2025 StakED. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
