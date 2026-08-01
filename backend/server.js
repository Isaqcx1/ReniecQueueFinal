import "dotenv/config";

import app from "./src/app.js";

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("=================================");
    console.log("     API RENIEC Queue activa");
    console.log("=================================");
    console.log(
        `Servidor: http://localhost:${PORT}`
    );
    console.log(
        `Prueba: http://localhost:${PORT}/api/health`
    );
    console.log("");
});