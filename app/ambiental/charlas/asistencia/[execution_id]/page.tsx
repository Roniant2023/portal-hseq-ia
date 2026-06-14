"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
};

export default function AsistenciaCharlaPage() {
  const params = useParams();
  const executionId = params.execution_id as string;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const [participantName, setParticipantName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const { data: execution, error: executionError } = await supabase
      .from("hseq_talk_executions")
      .select(`
        id,
        hseq_monthly_schedule (
          hseq_talk_library (
            id
          )
        )
      `)
      .eq("id", executionId)
      .single();

    if (executionError) {
      console.error(executionError);
      setMessage("No fue posible cargar la charla.");
      return;
    }

    const schedule = Array.isArray(execution.hseq_monthly_schedule)
      ? execution.hseq_monthly_schedule[0]
      : execution.hseq_monthly_schedule;

    const library = Array.isArray(schedule?.hseq_talk_library)
      ? schedule.hseq_talk_library[0]
      : schedule?.hseq_talk_library;

    const talkLibraryId = library?.id;

    if (!talkLibraryId) {
      setMessage("No se encontró la biblioteca asociada a esta charla.");
      return;
    }

    const { data: questionData, error: questionError } = await supabase
      .from("hseq_talk_questions")
      .select(
        "id, question, option_a, option_b, option_c, option_d, correct_answer"
      )
      .eq("talk_id", talkLibraryId)
      .order("created_at", { ascending: true });

    if (questionError) {
      console.error(questionError);
      setMessage("No fue posible cargar las preguntas.");
    } else {
      setQuestions(questionData || []);
    }
  };

  const startDrawing = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    isDrawing.current = true;
    draw(event);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    ctx?.beginPath();
  };

  const draw = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const canvasToFile = async (): Promise<File | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );

    if (!blob) return null;

    return new File([blob], `firma-${Date.now()}.png`, {
      type: "image/png",
    });
  };

  const handleSave = async () => {
    setMessage("");

    if (!participantName.trim() || !participantId.trim()) {
      setMessage("Debe diligenciar nombre y cédula.");
      return;
    }

    for (const question of questions) {
      if (!answers[question.id]) {
        setMessage("Debe responder todas las preguntas.");
        return;
      }
    }

    setSaving(true);

    try {
const { data: currentExecution, error: currentExecutionError } = await supabase
  .from("hseq_talk_executions")
  .select(`
    id,
    hseq_monthly_schedule (
      year,
      month,
      talk_library_id
    )
  `)
  .eq("id", executionId)
  .single();

if (currentExecutionError) throw currentExecutionError;

const schedule = Array.isArray(currentExecution.hseq_monthly_schedule)
  ? currentExecution.hseq_monthly_schedule[0]
  : currentExecution.hseq_monthly_schedule;

const { data: existingAttendance, error: existingAttendanceError } =
  await supabase
    .from("hseq_talk_attendance")
    .select(`
      id,
      hseq_talk_executions (
        hseq_monthly_schedule (
          year,
          month,
          talk_library_id
        )
      )
    `)
    .eq("participant_id", participantId.trim());

if (existingAttendanceError) throw existingAttendanceError;

const alreadyRegistered = (existingAttendance || []).some((item: any) => {
  const execution = Array.isArray(item.hseq_talk_executions)
    ? item.hseq_talk_executions[0]
    : item.hseq_talk_executions;

  const registeredSchedule = Array.isArray(execution?.hseq_monthly_schedule)
    ? execution.hseq_monthly_schedule[0]
    : execution?.hseq_monthly_schedule;

  return (
    registeredSchedule?.year === schedule?.year &&
    registeredSchedule?.month === schedule?.month &&
    registeredSchedule?.talk_library_id === schedule?.talk_library_id
  );
});

if (alreadyRegistered) {
  setMessage(
    "Esta cédula ya registra participación en esta charla durante el mes actual."
  );
  setSaving(false);
  return;
}
      const signatureFile = await canvasToFile();

      if (!signatureFile) {
        setMessage("Debe registrar la firma.");
        setSaving(false);
        return;
      }

      const signaturePath = `${executionId}/${participantId}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("hseq-talk-signatures")
        .upload(signaturePath, signatureFile);

      if (uploadError) throw uploadError;

      const { data: signatureUrlData } = supabase.storage
        .from("hseq-talk-signatures")
        .getPublicUrl(signaturePath);

      let correctCount = 0;

      const answerRecords = questions.map((question) => {
        const selected = answers[question.id];
        const isCorrect = selected === question.correct_answer;

        if (isCorrect) correctCount += 1;

        return {
          question_id: question.id,
          selected_answer: selected,
          is_correct: isCorrect,
        };
      });

      const score =
        questions.length > 0
          ? Math.round((correctCount / questions.length) * 100)
          : null;

      const approved = score === null ? true : score >= 80;

      const { data: attendance, error: attendanceError } = await supabase
        .from("hseq_talk_attendance")
        .insert({
          execution_id: executionId,
          participant_name: participantName,
          participant_id: participantId,
          position,
          company,
          score,
          approved,
          signature_url: signatureUrlData.publicUrl,
        })
        .select()
        .single();

      if (attendanceError) throw attendanceError;

      if (answerRecords.length > 0) {
        const answersToInsert = answerRecords.map((answer) => ({
          attendance_id: attendance.id,
          ...answer,
        }));

        const { error: answersError } = await supabase
          .from("hseq_talk_attendance_answers")
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      setMessage(
        score === null
          ? "Asistencia registrada exitosamente."
          : `Registro exitoso. Resultado: ${score}%. ${
              approved ? "Aprobado." : "Requiere refuerzo."
            }`
      );

      setParticipantName("");
      setParticipantId("");
      setPosition("");
      setCompany("");
      setAnswers({});
      clearSignature();
    } catch (error: any) {
      console.error(error);
      setMessage(`Error al registrar: ${error?.message || "Error desconocido"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black">Registro de asistencia</h1>

        <p className="mt-2 text-sm text-gray-600">
          Diligencie sus datos, responda el cuestionario y firme la asistencia.
        </p>

        <section className="mt-8 rounded border border-black p-4">
          <div className="grid gap-4">
            <input
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Nombre completo"
              className="w-full rounded border border-black px-3 py-2 text-sm"
            />

            <input
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              placeholder="Cédula"
              className="w-full rounded border border-black px-3 py-2 text-sm"
            />

            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Cargo"
              className="w-full rounded border border-black px-3 py-2 text-sm"
            />

            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Empresa"
              className="w-full rounded border border-black px-3 py-2 text-sm"
            />
          </div>
        </section>

        {questions.length > 0 && (
          <section className="mt-6 rounded border border-black p-4">
            <h2 className="text-xl font-bold">Cuestionario</h2>

            <div className="mt-4 grid gap-5">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded border p-3">
                  <p className="font-semibold">
                    {index + 1}. {question.question}
                  </p>

                  {[
                    ["A", question.option_a],
                    ["B", question.option_b],
                    ["C", question.option_c],
                    ["D", question.option_d],
                  ].map(([value, label]) => (
                    <label key={value} className="mt-2 flex gap-2 text-sm">
                      <input
                        type="radio"
                        name={question.id}
                        value={value}
                        checked={answers[question.id] === value}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                      />
                      {value}. {label}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded border border-black p-4">
          <h2 className="text-xl font-bold">Firma</h2>

          <canvas
            ref={canvasRef}
            width={500}
            height={180}
            className="mt-3 w-full rounded border border-black bg-white touch-none"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
          />

          <button
            type="button"
            onClick={clearSignature}
            className="mt-3 rounded border border-black px-4 py-2 text-sm"
          >
            Limpiar firma
          </button>
        </section>

        {message && (
          <div className="mt-6 rounded border border-black bg-gray-50 px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Registrando..." : "Registrar asistencia"}
          </button>
        </div>
      </div>
    </main>
  );
}