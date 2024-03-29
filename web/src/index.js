import React from "react";
import ReactDOM from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "./assets/css/index.css";

import App from "./pages/App.jsx";
import Layout from "./components/Layout.jsx";
import reportWebVitals from "./reportWebVitals";

const defaultTheme = createTheme();
const basename = process.env.PUBLIC_URL;

const AppWrap = () => {
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Layout>
        <App />
      </Layout>
    </ThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter basename={basename}>
    <Routes>
      <Route path="/" exact element={<AppWrap />} />
    </Routes>
  </BrowserRouter>,
);

reportWebVitals();
