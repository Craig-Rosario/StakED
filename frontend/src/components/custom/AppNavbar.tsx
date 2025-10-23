import { SidebarTrigger } from "@/components/ui/sidebar";

export const AppNavbar = () => {
  return (
    <header className="relative w-full border-b-2 border-black bg-white dark:bg-zinc-900 flex items-center justify-center px-4 sm:px-6 py-3">
      <div className="absolute left-4 sm:left-6">
        <SidebarTrigger className="p-2 border-2 border-black hover:scale-105 transition-transform bg-blue-500 text-white font-bold cursor-pointer" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">
        Stak<span className="text-[#FF4C4C]">E</span>
        <span className="text-[#01a72a]">D</span>
      </h1>
    </header>
  );
};
