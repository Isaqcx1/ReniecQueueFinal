import express from "express";

import {
    obtenerSedes,
    obtenerSedePorId,
} from "../controllers/sedeController.js";


const router =
    express.Router();


router.get(
    "/",
    obtenerSedes
);

router.get(
    "/:idSede",
    obtenerSedePorId
);


export default router;