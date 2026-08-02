import { Router } from "express";

import {
    asignarTurno,
    obtenerColaPorSede,
    llamarSiguienteTurno,
} from "../controllers/turnoController.js";

const router = Router();

/*
Registrar un turno desde la aplicación móvil.
REN-11
*/
router.post(
    "/",
    asignarTurno
);

/*
Llamar al siguiente turno desde la web.
REN-16
*/
router.post(
    "/siguiente",
    llamarSiguienteTurno
);

/*
Consultar la cola activa de una sede.
REN-12
*/
router.get(
    "/sede/:idSede",
    obtenerColaPorSede
);

export default router;