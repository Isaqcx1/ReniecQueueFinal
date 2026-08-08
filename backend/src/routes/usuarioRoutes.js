import express from "express";

import {
    verificarCiudadano,
    registrarUsuario,
    iniciarSesionUsuario,
    obtenerPerfilUsuario,
    actualizarPerfilUsuario,
    cambiarPasswordUsuario,
} from "../controllers/usuarioController.js";

const router = express.Router();

router.get(
    "/verificar/:dni",
    verificarCiudadano
);

router.post(
    "/registro",
    registrarUsuario
);

router.post(
    "/login",
    iniciarSesionUsuario
);

router.get(
    "/:dni",
    obtenerPerfilUsuario
);

router.patch(
    "/:dni/perfil",
    actualizarPerfilUsuario
);

router.patch(
    "/:dni/password",
    cambiarPasswordUsuario
);

export default router;