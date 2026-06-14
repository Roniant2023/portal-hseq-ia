"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function DetalleResultadoPage() {
  const params = useParams();
  const id = params.id as string;

  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecution();
  }, []);

  const loadExecution = async () => {
    const { data, error } = await supabase
      .from("hseq_talk_executions")
      .select(`
        *,
        hseq_monthly_schedule (
          week_number,
          hseq_talk_library (
            title,
            category
          )
        ),
        hseq_talk_attendance (
          *
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setExecution(data);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        Cargando detalle...
      </main>
    );
  }

  if (!execution) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        No se encontró la ejecución.
      </main>
    );
  }

  const attendees = execution.hseq_talk_attendance || [];

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-black">
          Detalle de ejecución
        </h1>

<button
  type="button"
  onClick={() => window.print()}
  className="no-print mt-4 rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
>
  Generar PDF
</button>

        <div className="mt-8 rounded border border-black p-5">
          <h2 className="text-2xl font-bold">
            {
              execution.hseq_monthly_schedule?.hseq_talk_library?.title
            }
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <strong>Ubicación:</strong> {execution.location}
            </div>

            <div>
              <strong>Responsable:</strong> {execution.responsible}
            </div>

            <div>
              <strong>Fecha:</strong> {execution.executed_date}
            </div>

            <div>
              <strong>Estado:</strong> {execution.status}
            </div>
          </div>
        </div>

        {execution.evidence_photo_url && (
          <section className="mt-6 rounded border border-black p-5">
            <h2 className="text-xl font-bold">
              Evidencia fotográfica
            </h2>

            <img
              src={execution.evidence_photo_url}
              alt="Evidencia"
              className="mt-4 max-h-[600px] rounded border"
            />
          </section>
        )}

        <section className="mt-6 rounded border border-black p-5">
          <h2 className="text-xl font-bold">
            Participantes ({attendees.length})
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Cédula</th>
                  <th className="p-2 text-left">Cargo</th>
                  <th className="p-2 text-left">Empresa</th>
                  <th className="p-2 text-left">Resultado</th>
<th className="p-2 text-left">Firma</th>
                </tr>
              </thead>

              <tbody>
                {attendees.map((person: any) => (
                  <tr key={person.id} className="border-b">
                    <td className="p-2">
                      {person.participant_name}
                    </td>

                    <td className="p-2">
                      {person.participant_id}
                    </td>

                    <td className="p-2">
                      {person.position}
                    </td>

                    <td className="p-2">
                      {person.company}
                    </td>

                    <td className="p-2 font-semibold">
                      {person.score ?? "-"}%
                    </td>
<td className="p-2">
  {person.signature_url ? (
    <img
      src={person.signature_url}
      alt="Firma"
      className="h-16 max-w-[160px] rounded border object-contain"
    />
  ) : (
    "Sin firma"
  )}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

     </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white;
          }

          main {
            padding: 20px !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </main>
  );
}