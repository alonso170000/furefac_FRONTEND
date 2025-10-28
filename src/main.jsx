import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import App from "./App.jsx";

// ADMIN
import Protegida from "./administracion/rutas/Protegida.jsx";
import LayoutAdmin from "./administracion/LayoutAdmin.jsx";
import Acceso from "./administracion/paginas/Acceso.jsx";
import Panel from "./administracion/paginas/Panel.jsx";

// PÚBLICO
import PrincipalHome from "./principal/Home.jsx";


const router = createBrowserRouter([
  // público
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <PrincipalHome /> },
    ],
  },

  // login admin
  { path: "/administracion/acceso", element: <Acceso /> },

  // protegido admin
  {
    path: "/administracion",
    element: <Protegida />,
    children: [
      {
        element: <LayoutAdmin />,
        children: [
          { index: true, element: <Panel /> },
        ],
      },
    ],
  },

  { path: "*", element: <div ></div> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
