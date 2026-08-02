import { Router } from "express";

import {
    asignarTurno,
    obtenerColaPorSede,
} from "../controllers/turnoController.js";

const router = Router();

/*
Registrar un turno desde la aplicación móvil.
*/
router.post(
    "/",
    asignarTurno
);

/*
Consultar la cola activa de una sede.
*/
router.get(
    "/sede/:idSede",
    obtenerColaPorSede
);

export default router;