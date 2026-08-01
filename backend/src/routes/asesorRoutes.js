import { Router } from "express";

import {
    iniciarSesionAsesor,
} from "../controllers/asesorController.js";

const router = Router();

router.post(
    "/login",
    iniciarSesionAsesor
);

export default router;