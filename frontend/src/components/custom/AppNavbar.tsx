import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";


export const AppNavbar = () => {

  return (
    <header className="w-full border-b-2 border-black bg-white dark:bg-zinc-900 flex items-center justify-between px-4 sm:px-6 py-3 flex-wrap gap-3">
      <SidebarTrigger className="p-2 border-2 border-black hover:scale-105 transition-transform bg-blue-500 text-white font-bold cursor-pointer" />

        <h1 className="text-2xl font-extrabold tracking-tight">
            Stak<span className="text-[#FF4C4C]">E</span><span className="text-[#01a72a]">D</span>
        </h1>

      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="truncate max-w-[120px] sm:max-w-none">
              <span className="font-bold text-green-600">✓</span>{" "}
              <span className="hidden sm:inline">Wallet Connected</span>
              <span className="sm:hidden">Wallet Connected</span>
            </div>
            <Button
              size="sm"
              className="border-2 border-black bg-transparent font-bold hover:bg-gray-100 px-2 sm:px-3 cursor-pointer"
            >
              Disconnect
            </Button>
          </div>
      </div>
    </header>
  );
};