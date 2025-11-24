import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./main.css";

import App from "./App.jsx";

// ADMIN
import Protegida from "./administracion/rutas/Protegida.jsx";
import LayoutAdmin from "./administracion/LayoutAdmin.jsx";
import Acceso from "./administracion/paginas/Acceso.jsx";
import Panel from "./administracion/paginas/Panel.jsx";
import Productos from "./administracion/paginas/Productos.jsx";
import Usuarios from "./administracion/paginas/Usuarios.jsx";
import Cotizaciones from "./administracion/paginas/Cotizaciones.jsx";

// PÚBLICO
import PrincipalHome from "./principal/Home.jsx";

const router = createBrowserRouter([
  // ========== RUTAS PÚBLICAS ==========
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <PrincipalHome /> },
    ],
  },

  // ========== LOGIN ADMIN ==========
  { 
    path: "/administracion/acceso", 
    element: <Acceso /> 
  },

  // ========== RUTAS PROTEGIDAS ADMIN (TODO EN UN SOLO BLOQUE) ==========
  {
    path: "/administracion",
    element: <Protegida />,
    children: [
      {
        element: <LayoutAdmin />,
        children: [
          { index: true, element: <Panel /> },              // /administracion
          { path: "panel", element: <Panel /> },             // /administracion/panel
          { path: "productos", element: <Productos /> },     // /administracion/productos
          { path: "usuarios", element: <Usuarios /> },       // /administracion/usuarios
          { path: "buzon/cotizaciones", element: <Cotizaciones /> },
        ],
      },
    ],
  },

  // ========== 404 ==========
  { 
    path: "*", 
    element: (
      <div style={{ 
        padding: "40px", 
        textAlign: "center",
        fontSize: "18px",
        color: "#666"
      }}>
        404 - Página no encontrada
      </div>
    ) 
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
