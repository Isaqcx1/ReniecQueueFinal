import { Router } from "express";

import {
    asignarTurno,
    obtenerColaPorSede,
    llamarSiguienteTurno,
    actualizarEstadoTurno,
} from "../controllers/turnoController.js";

const router = Router();

/*
Asignar turno desde la aplicación móvil.
REN-11
*/
router.post(
    "/",
    asignarTurno
);

/*
Llamar al siguiente turno.
REN-16
*/
router.post(
    "/siguiente",
    llamarSiguienteTurno
);

/*
Actualizar el estado del turno.
REN-18
*/
router.patch(
    "/:idTurno/estado",
    actualizarEstadoTurno
);

/*
Consultar la cola por sede.
REN-12
*/
router.get(
    "/sede/:idSede",
    obtenerColaPorSede
);

export default router;