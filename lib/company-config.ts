export type CompanyConfig = {
  id: "estrella" | "pegasso";
  name: string;
  shortName: string;
  logo: string;

  icons: {
    controlTrabajo: string;
    trabajoAlturas: string;
    salud: string;
    ambiental: string;
    seguridadVial: string;
    espaciosConfinados: string;
  };
};

const companies: Record<string, CompanyConfig> = {
  estrella: {
    id: "estrella",
    name: "Estrella International Energy Services",
    shortName: "Estrella",
    logo: "/logo-eies.png",

    icons: {
      controlTrabajo: "/icons/control-trabajo.png",
      trabajoAlturas: "/icons/trabajo-alturas.png",
      salud: "/icons/salud.png",
      ambiental: "/icons/ambiental.png",
      seguridadVial: "/icons/seguridad-vial.png",
      espaciosConfinados: "/icons/espacios-confinados.png",
    },
  },

  pegasso: {
    id: "pegasso",
    name: "PEGASSO Petroleum & Gas Solutions S.A.S.",
    shortName: "PEGASSO",
    logo: "/logo-pegasso.png",

    icons: {
      controlTrabajo: "/icons/control-trabajo-pegasso.png",
      trabajoAlturas: "/icons/trabajo-alturas-pegasso.png",
      salud: "/icons/salud-pegasso.png",
      ambiental: "/icons/ambiental-pegasso.png",
      seguridadVial: "/icons/seguridad-vial-pegasso.png",
      espaciosConfinados: "/icons/espacios-confinados-pegasso.png",
    },
  },
};

export function getCompanyConfig(): CompanyConfig {
  const company =
    process.env.NEXT_PUBLIC_COMPANY?.toLowerCase() || "estrella";

  return companies[company] || companies.estrella;
}