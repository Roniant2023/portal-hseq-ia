"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type Talk = {
  id: string;
  title: string;
  category: string;
};

type Question = {
  id: string;
  question: string;
  correct_answer: string;
};

export default function PreguntasCharlasPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [talkId, setTalkId] = useState("");
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    loadTalks();
  }, []);

  const loadTalks = async () => {
    const { data, error } = await supabase
      .from("hseq_talk_library")
      .select("id, title, category")
      .eq("status", "activa")
      .order("title", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setTalks(data || []);
    }
  };

const loadQuestions = async (selectedTalkId: string) => {
  if (!selectedTalkId) {
    setQuestions([]);
    return;
  }

  const { data, error } = await supabase
    .from("hseq_talk_questions")
    .select("id, question, correct_answer")
    .eq("talk_id", selectedTalkId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
  } else {
    setQuestions(data || []);
  }
};

  const handleSave = async () => {
    setMessage("");

    if (
      !talkId ||
      !question.trim() ||
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim()
    ) {
      setMessage("Debe diligenciar la charla, pregunta y todas las opciones.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("hseq_talk_questions").insert({
      talk_id: talkId,
      question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_answer: correctAnswer,
    });

if (error) {
  console.log(error);
  setMessage(error.message);
}    
 else {
      setMessage("Pregunta guardada exitosamente.");
      setQuestion("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("A");
loadQuestions(talkId);
    }

    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black">Preguntas de evaluación</h1>

        <p className="mt-2 text-gray-600">
          Cargue las preguntas asociadas a cada charla de la biblioteca.
        </p>

        <section className="mt-8 rounded border border-black p-4">
          <h2 className="mb-4 text-base font-semibold">
            Seleccionar charla
          </h2>

          <label className="mb-1 block text-xs text-gray-600">
            Charla de la biblioteca
          </label>

          <select
            value={talkId}
            onChange={(e) => {
  setTalkId(e.target.value);
  loadQuestions(e.target.value);
}}
            className="w-full rounded border border-black px-3 py-2 text-sm"
          >
            <option value="">Seleccione una charla</option>

            {talks.map((talk) => (
              <option key={talk.id} value={talk.id}>
                {talk.title} — {talk.category}
              </option>
            ))}
          </select>
        </section>

        <section className="mt-6 rounded border border-black p-4">
          <h2 className="mb-4 text-base font-semibold">Nueva pregunta</h2>

          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Pregunta
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Escriba la pregunta"
                className="min-h-20 w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Opción A
              </label>
              <input
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Opción B
              </label>
              <input
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Opción C
              </label>
              <input
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Opción D
              </label>
              <input
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Respuesta correcta
              </label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full rounded border border-black px-3 py-2 text-sm"
              >
                <option value="A">Opción A</option>
                <option value="B">Opción B</option>
                <option value="C">Opción C</option>
                <option value="D">Opción D</option>
              </select>
            </div>
          </div>
        </section>

<section className="mt-6 rounded border border-black p-4">
  <h2 className="mb-4 text-base font-semibold">
    Preguntas cargadas
  </h2>

  {questions.length === 0 ? (
    <p className="text-sm text-gray-600">
      No hay preguntas cargadas para esta charla.
    </p>
  ) : (
    <div className="overflow-x-auto rounded border border-gray-300">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">#</th>
            <th className="p-3 text-left">Pregunta</th>
            <th className="p-3 text-left">Respuesta correcta</th>
          </tr>
        </thead>

        <tbody>
          {questions.map((item, index) => (
            <tr key={item.id} className="border-t">
              <td className="p-3">{index + 1}</td>
              <td className="p-3">{item.question}</td>
              <td className="p-3 font-semibold">
                Opción {item.correct_answer}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
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
            {saving ? "Guardando..." : "Guardar pregunta"}
          </button>
        </div>
      </div>
    </main>
  );
}