import React, { ReactNode, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from 'react-error-boundary';  
import App from "./App";
import "./tailwind.css";
import ShopToaster from "./components/ShopToaster";
import { store } from "./store";
import Error500 from "@/errors/500Error";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";  // Import i18n configuration

type AppProviderProps = {
  children: ReactNode;
};

function AppProvider(props: AppProviderProps) {
  const { children } = props;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <I18nextProvider i18n={i18n}>  {/* Wrap app with i18n provider */}
        <Provider store={store}>
          <BrowserRouter>
            <ErrorBoundary FallbackComponent={Error500}>
              <ShopToaster />
              {children}
            </ErrorBoundary>
          </BrowserRouter>
        </Provider>
      </I18nextProvider>
    </Suspense>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
