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

import { ChartLine, CalendarDays, LogOut, Users } from "lucide-react";

export const AppSidebar = () => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "upcomingTest" | "classmates"
  >("dashboard");
  const navigate = useNavigate();

  const handleNavigate = (tab: typeof activeTab, route: string) => {
    setActiveTab(tab);
    navigate(route);
  };

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
  group-data-[state=collapsed]:justify-center`}
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
  group-data-[state=collapsed]:justify-center`}
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
  group-data-[state=collapsed]:justify-center`}
            >
              <Users className="w-6 h-6" />
              <span>Classmates</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="px-4 py-3 flex gap-3 group-data-[state=collapsed]:gap-0  group-data-[state=collapsed]:justify-center text-lg border-4 border-black font-bold uppercase bg-white hover:bg-red-500 hover:text-white transition-transform hover:scale-100">
              <LogOut className="w-6 h-6" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
