import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./router/AppRoutes"
import { NotificationProvider, TransactionPopupProvider } from "@blockscout/app-sdk"
import { useEffect } from "react"

const App = () => {
  useEffect(() => {
    // Request notification permissions on app load
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        console.log("Notification permission:", permission);
      });
    }
    console.log("App mounted, notification providers initialized");
  }, []);

  return (
    <NotificationProvider>
      <TransactionPopupProvider>
        <div className="toast-container">
          <BrowserRouter>
            <AppRoutes/>
          </BrowserRouter>
        </div>
      </TransactionPopupProvider>
    </NotificationProvider>
  )
}

export default App
