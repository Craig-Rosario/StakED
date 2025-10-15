
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/AppSidebar";
import { AppNavbar } from "@/components/custom/AppNavbar"; // ✅ import navbar
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content area */}
        <div className="flex flex-col flex-1 w-full">
          {/* ✅ Navbar with sidebar trigger */}
          <AppNavbar />

          {/* Page Content */}
          <main className="flex-1 p-6 bg-gray-50 dark:bg-zinc-900">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;