import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../components/Loginc.css";

import logo from "../img/logor.png";
import fila from "../img/filar.png";

const API_URL = "http://localhost:3001";

export default function Login() {
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);

    const iniciarSesion = async (event) => {
        event.preventDefault();

        setMensaje("");

        if (
            usuario.trim() === "" ||
            contrasena.trim() === ""
        ) {
            setMensaje(
                "Ingrese su usuario y contraseña."
            );
            return;
        }

        try {
            setCargando(true);

            const respuesta = await fetch(
                `${API_URL}/api/asesores/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        usuario: usuario.trim(),
                        contrasena,
                    }),
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setMensaje(
                    datos.mensaje ||
                        "No se pudo iniciar sesión."
                );
                return;
            }

            localStorage.setItem(
                "asesorSesion",
                JSON.stringify(datos.asesor)
            );

            navigate("/perfil", {
                replace: true,
            });

        } catch (error) {
            console.error(
                "Error al iniciar sesión:",
                error
            );

            setMensaje(
                "No se pudo conectar con el servidor."
            );

        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container">

            <div className="left-side">
                <img
                    src={fila}
                    alt="Fila de atención"
                    className="hero-image"
                />
            </div>

            <div className="right-side">

                <form
                    className="login-box"
                    onSubmit={iniciarSesion}
                >

                    <img
                        src={logo}
                        alt="RENIEC Queue"
                        className="logo"
                    />

                    <h2>Inicio de Sesión</h2>

                    <p>
                        Acceso para asesores
                    </p>

                    <input
                        type="text"
                        placeholder="Usuario"
                        value={usuario}
                        onChange={(event) =>
                            setUsuario(
                                event.target.value
                            )
                        }
                        autoComplete="username"
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={contrasena}
                        onChange={(event) =>
                            setContrasena(
                                event.target.value
                            )
                        }
                        autoComplete="current-password"
                    />

                    {mensaje !== "" && (
                        <div className="login-message">
                            {mensaje}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={cargando}
                    >
                        {cargando
                            ? "Ingresando..."
                            : "Ingresar"}
                    </button>

                </form>

            </div>

        </div>
    );
}