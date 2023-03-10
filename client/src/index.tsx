import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { ApiProvider } from "@reduxjs/toolkit/dist/query/react";

import App from "./App";
import { persistor, store } from "./store/features/store";
import { apiAuthSlice } from "./features/api/apiAuthSlice";
import { PersistGate } from "redux-persist/integration/react";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <ApiProvider api={apiAuthSlice}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </ApiProvider>
  </React.StrictMode>
);
