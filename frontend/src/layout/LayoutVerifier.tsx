import { AppNavbar } from "@/components/custom/AppNavbar"
import AppSidebarVerifier from "@/components/custom/AppSidebarVerifier"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom"

const LayoutVerifier = () => {
    return (
        <div>
            <SidebarProvider>
                <div className="flex min-h-screen w-full">
                    <AppSidebarVerifier />

                    <div className="flex flex-col flex-1 w-full">
                        <AppNavbar />

                        <main className="flex-1 p-6 bg-gray-50 dark:bg-zinc-900">
                            <Outlet />
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </div>
    )
}

export default LayoutVerifier
