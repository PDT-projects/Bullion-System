
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./providers/context/AuthContext";
import { CurrencyProvider } from "./providers/context/CurrencyContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <CurrencyProvider>
      <RouterProvider router={router} />
    </CurrencyProvider>
  </AuthProvider>
);
