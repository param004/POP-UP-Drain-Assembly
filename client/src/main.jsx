import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/index.css";

/*
 * No providers, because there is nothing to share.
 *
 * The cart, wishlist and session used to wrap the app in providers that fetched from
 * the API. All three are gone with the server, and the product catalogue is now
 * imported directly, so React Query has no queries left to manage either.
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
