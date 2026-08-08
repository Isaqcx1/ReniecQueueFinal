import {
    Router,
} from "express";

import {
    iniciarSesionAsesor,
    obtenerDashboardAsesor,
    obtenerReporteAsesor,
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
router.get(
    "/reportes/:idSede",
    obtenerReporteAsesor
);

export default router;