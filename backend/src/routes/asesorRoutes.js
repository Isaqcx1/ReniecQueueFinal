import {
    Router,
} from "express";

import {
    iniciarSesionAsesor,
    obtenerDashboardAsesor,
} from "../controllers/asesorController.js";

const router =
    Router();

router.post(
    "/login",
    iniciarSesionAsesor
);

router.get(
    "/dashboard/:idSede",
    obtenerDashboardAsesor
);

export default router;