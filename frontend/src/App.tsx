import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./router/AppRoutes"
import { NotificationProvider, TransactionPopupProvider } from "@blockscout/app-sdk"

const App = () => {
  return (
    <NotificationProvider>
      <TransactionPopupProvider>
        <div>
          <BrowserRouter>
            <AppRoutes/>
          </BrowserRouter>
        </div>
      </TransactionPopupProvider>
    </NotificationProvider>
  )
}

export default App
