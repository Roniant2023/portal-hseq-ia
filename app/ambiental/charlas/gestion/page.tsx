"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const ACCESS_PASSWORD = "Estrella2026100%";

const modules = [
  {
    title: "Biblioteca de charlas",
    description:
      "Crear charlas maestras y cargar material de apoyo.",
    href: "/ambiental/charlas/biblioteca",
  },
  {
    title: "Preguntas",
    description:
      "Administrar preguntas de evaluación por charla.",
    href: "/ambiental/charlas/preguntas",
  },
  {
    title: "Programación mensual",
    description:
      "Programar las charlas semanales de cada mes.",
    href: "/ambiental/charlas/programacion",
  },
  {
    title: "Resultados",
    description:
      "Consultar ejecuciones, asistentes y resultados por ubicación.",
    href: "/ambiental/charlas/resultados",
  },
];
export default function GestionCharlasPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
useEffect(() => {
  const access = localStorage.getItem("charlas_hseq_access");

  if (access === "true") {
    setAuthorized(true);
  }
}, []);

  const handleAccess = () => {
   if (password === ACCESS_PASSWORD) {
  localStorage.setItem("charlas_hseq_access", "true");
  setAuthorized(true);
  setError("");
}
else {
      setError("Clave incorrecta.");
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-6xl">

        <div className="mb-10 flex items-center justify-between">
  <div>
    <h1 className="text-4xl font-black">
      Gestión de Charlas HSEQ
    </h1>

    <p className="mt-2 text-gray-600">
      Administración de biblioteca, preguntas y programación.
    </p>
  </div>

  <div className="flex items-center gap-4">
    {authorized && (
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem("charlas_hseq_access");
          setAuthorized(false);
          setPassword("");
        }}
        className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Cerrar sesión
      </button>
    )}

    <Image
      src="/logo-eies.png"
      alt="Logo"
      width={180}
      height={70}
      className="h-16 w-auto"
    />
  </div>
</div>
        {!authorized ? (
          <section className="mx-auto max-w-md rounded-xl border border-black p-6">
            <h2 className="text-xl font-bold">
              Acceso restringido
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Ingrese la clave de administración.
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Clave"
              className="mt-4 w-full rounded border border-black px-3 py-2"
            />

            {error && (
              <div className="mt-3 rounded border border-red-600 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleAccess}
              className="mt-4 w-full rounded bg-green-700 px-4 py-3 font-semibold text-white"
            >
              Ingresar
            </button>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="rounded-xl border border-black p-6 transition hover:bg-gray-50"
              >
                <h2 className="text-xl font-bold">
                  {module.title}
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  {module.description}
                </p>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}