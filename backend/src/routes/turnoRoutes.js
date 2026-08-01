import { Router } from "express";

import {
    asignarTurno,
} from "../controllers/turnoController.js";

const router = Router();

router.post(
    "/",
    asignarTurno
);

export default router;