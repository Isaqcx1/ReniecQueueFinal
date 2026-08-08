import { Router } from "express";

import {
    asignarTurno,
    obtenerColaPorSede,
    llamarSiguienteTurno,
    actualizarEstadoTurno,
    obtenerTurnoActivo,
    cancelarTurno,
    obtenerHistorialTurnos,
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
Cancelar turno desde la aplicación móvil.
REN-15
*/
router.patch(
    "/:idTurno/cancelar",
    cancelarTurno
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
Seguimiento desde la aplicación móvil.
REN-13
*/
router.get(
    "/activo/:dni",
    obtenerTurnoActivo
);
/*
Historial de turnos del ciudadano.
REN-17
*/
router.get(
    "/historial/:dni",
    obtenerHistorialTurnos
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