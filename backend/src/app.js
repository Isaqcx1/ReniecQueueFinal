import express from "express";
import cors from "cors";


import {
    comprobarConexion,
} from "./config/database.js";

import asesorRoutes from "./routes/asesorRoutes.js";
import turnoRoutes from "./routes/turnoRoutes.js";
import usuarioRoutes
    from "./routes/usuarioRoutes.js";
import sedeRoutes from "./routes/sedeRoutes.js";
import path from "path";
import { fileURLToPath } from "url";


const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

const publicPath =
    path.join(
        __dirname,
        "../public"
    );

    console.log(
    "Ruta public:",
    publicPath
);

console.log(
    "Ruta imagen:",
    path.join(
        publicPath,
        "images",
        "sedes",
        "san-isidro.jpg"
    )
);

const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:3000",
        ],
        credentials: true,
    })
);

app.use(express.json());

app.use(
    "/api/asesores",
    asesorRoutes
);
app.use(
    "/api/turnos",
    turnoRoutes
);
app.use(
    "/api/usuarios",
    usuarioRoutes
);
app.use(
    "/api/sedes",
    sedeRoutes
);

app.get("/", (req, res) => {
    res.status(200).json({
        ok: true,
        mensaje:
            "API de RENIEC Queue funcionando.",
    });
});

app.get("/api/health", async (req, res) => {
    try {
        const conexion =
            await comprobarConexion();

        res.status(200).json({
            ok: true,
            mensaje:
                "Backend conectado correctamente con PostgreSQL.",
            conexion,
        });
    } catch (error) {
        console.error(
            "Error al conectar con PostgreSQL:",
            error
        );

        res.status(500).json({
            ok: false,
            mensaje:
                "No se pudo conectar con PostgreSQL.",
            error: error.message,
        });
    }
});
app.use(
    "/images",
    express.static(
        path.join(
            publicPath,
            "images"
        )
    )
);

/*
Esta parte siempre debe quedar al final.
*/
app.use((req, res) => {
    res.status(404).json({
        ok: false,
        mensaje: "Ruta no encontrada.",
    });
});



export default app;