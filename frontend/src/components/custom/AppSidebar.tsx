"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { ChartLine, CalendarDays, LogOut, Users, User } from "lucide-react";

export const AppSidebar = () => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "upcomingTest" | "classmates"
  >("dashboard");
  const navigate = useNavigate();

  const handleNavigate = (tab: string, route: string) => {
    setActiveTab(tab);
    navigate(route);
  };

  const handleLogout = () => {
    window.location.href = "http://localhost:5173";
  };

  const ProfileSection = () => (
    <div className="px-2">
      <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_#000000]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-sm text-gray-800 truncate">Pangli Peryl</h3>
            <p className="text-xs font-mono text-gray-600 truncate">0x13...7A9</p>
          </div>
        </div>
        
        <SidebarMenuButton 
          onClick={handleLogout}
          className="w-full mt-3 px-3 py-2 flex gap-2 justify-center text-sm border-2 border-black font-bold uppercase bg-white hover:bg-red-500 hover:text-white transition-transform hover:scale-100 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </SidebarMenuButton>
      </div>
    </div>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="bg-white dark:bg-zinc-900 text-black dark:text-white border-r-4 border-black"
    >
      <SidebarHeader className="p-[14px] flex justify-center">
        <h1 className="text-2xl tracking-tighter">
          <span className="hidden font-extrabold group-data-[state=expanded]:block">
            Stak<span className="text-[#FF4C4C]">E</span><span className="text-[#01a72a]">D</span>
          </span>
          <span className="hidden font-mono group-data-[state=expanded]:block text-sm text-gray-500">
            Student Confidence Market
          </span>
          <span
            className=" group-data-[state=collapsed]:flex
    group-data-[state=collapsed]:justify-center
    group-data-[state=collapsed]:items-center font-extrabold  item group-data-[state=expanded]:hidden "
          >
            SK
          </span>
        </h1>
      </SidebarHeader>

      <SidebarContent className="mt-6 px-2">
        <SidebarMenu className="space-y-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigate("dashboard", "/user/dashboard")}
              isActive={activeTab === "dashboard"}
              className={`px-4 py-3 flex text-lg border-4 border-black font-bold 
                transition-transform hover:scale-100
                ${
                  activeTab === "dashboard"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                }
                gap-3 group-data-[state=collapsed]:gap-0
  group-data-[state=collapsed]:justify-center cursor-pointer`}
            >
              <ChartLine className="w-6 h-6" />
              <span>My Analytics</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() =>
                handleNavigate("upcomingTest", "/user/upcoming")
              }
              isActive={activeTab === "upcomingTest"}
              className={`px-4 py-3 flex text-lg border-4 border-black font-bold 
                transition-transform hover:scale-100
                ${
                  activeTab === "upcomingTest"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                }
                gap-3 group-data-[state=collapsed]:gap-0
  group-data-[state=collapsed]:justify-center cursor-pointer`}
            >
              <CalendarDays className="w-6 h-6" />
              <span>Upcoming Tests</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigate("classmates", "/user/classmates")}
              isActive={activeTab === "classmates"}
              className={`px-4 py-3 flex text-lg border-4 border-black font-bold
                transition-transform hover:scale-100
                ${
                  activeTab === "classmates"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                }
                 gap-3 group-data-[state=collapsed]:gap-0
  group-data-[state=collapsed]:justify-center cursor-pointer`}
            >
              <Users className="w-6 h-6" />
              <span>Classmates</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2">
        <div className="group-data-[state=collapsed]:hidden">
          <ProfileSection />
        </div>
        <div className="group-data-[state=expanded]:hidden">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleLogout}
                className="px-4 py-3 flex gap-3 justify-center text-lg border-4 border-black font-bold uppercase bg-white hover:bg-red-500 hover:text-white transition-transform hover:scale-100 cursor-pointer"
              >
                <LogOut className="w-6 h-6" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};