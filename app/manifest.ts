import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const company =
    process.env.NEXT_PUBLIC_COMPANY?.toLowerCase() || "estrella";

  const isPegasso = company === "pegasso";

  return {
    name: isPegasso ? "Portal HSEQ IA - PEGASSO" : "Portal HSEQ IA",
    short_name: isPegasso ? "HSEQ PEGASSO" : "HSEQ IA",
    description: "Portal inteligente para gestión HSEQ",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",

    icons: [
      {
        src: isPegasso
          ? "/icon-pegasso-192.png"
          : "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: isPegasso
          ? "/icon-pegasso-512.png"
          : "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}