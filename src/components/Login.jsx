import "../components/Loginc.css";

import logo from "../img/logor.png";
import fila from "../img/filar.png";

export default function Login() {
    return (
        <div className="login-container">

            {/* LADO IZQUIERDO */}
            <div className="left-side">
                <img
                    src={fila}
                    alt="Fila"
                    className="hero-image"
                />
            </div>

            {/* LADO DERECHO */}
            <div className="right-side">

                <div className="login-box">

                    <img
                        src={logo}
                        alt="RENIEC Queue"
                        className="logo"
                    />

                    <h2>Inicio de Sesión</h2>

                    <p>Acceso para asesores</p>

                    <input
                        type="text"
                        placeholder="Usuario"
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                    />

                    <button>
                        Ingresar
                    </button>

                </div>

            </div>

        </div>
    );
}