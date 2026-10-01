import React, { useEffect, useState } from "react";
import { api } from "../services/api";

// El backend está en el plan gratuito de Render: se duerme tras 15 minutos sin uso
// y tarda alrededor de un minuto en despertar. Este aviso aparece solo si el
// servidor no responde rápido, y recarga la página cuando ya está listo.
const healthURL = api.defaults.baseURL.replace(/\/api\/?$/, "") + "/health";

async function servidorResponde(ms) {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ms);
  try {
    const res = await fetch(healthURL, { signal: control.signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(temporizador);
  }
}

export default function ServerWakeBanner() {
  const [estado, setEstado] = useState("revisando"); // revisando | despertando | listo
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    let activo = true;

    (async () => {
      // Si responde en menos de 4 segundos, no mostrar nada.
      if (await servidorResponde(4000)) return;
      if (!activo) return;
      setEstado("despertando");

      while (activo) {
        if (await servidorResponde(10000)) {
          if (!activo) return;
          setEstado("listo");
          // Recargar para que la página vuelva a pedir productos, sesión, etc.
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (estado !== "despertando") return;
    const intervalo = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(intervalo);
  }, [estado]);

  if (estado === "revisando") return null;

  return (
    <div className={`serverWakeBanner ${estado === "listo" ? "serverWakeBannerOk" : ""}`} role="status">
      {estado === "despertando" ? (
        <>
          <span className="serverWakeSpinner" aria-hidden="true" />
          <span>
            <strong>Estamos despertando el servidor…</strong> Por estar en un plan gratuito, la primera carga
            puede tardar hasta 1 minuto. La página se actualizará sola. ({segundos}s)
          </span>
        </>
      ) : (
        <span>
          <strong>¡Servidor listo!</strong> Cargando la tienda…
        </span>
      )}
    </div>
  );
}
