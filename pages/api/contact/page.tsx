"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({
    nom: "", email: "", sujet: "", message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ nom: "", email: "", sujet: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Nous contacter</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Une question, un feedback sur SimuImmo ? Écrivez-nous.
      </p>

      {status === "success" ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
          <p className="text-green-700 font-medium">Message envoyé ✓</p>
          <p className="text-green-600 text-sm mt-1">Nous vous répondrons rapidement.</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 text-sm text-green-700 underline"
          >
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                placeholder="Jean Dupont"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jean@exemple.fr"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sujet</label>
            <select
              name="sujet"
              value={form.sujet}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choisir un sujet…</option>
              <option value="Feedback général">Feedback général</option>
              <option value="Bug / Problème technique">Bug / Problème technique</option>
              <option value="Question sur le simulateur">Question sur le simulateur</option>
              <option value="Demande de fonctionnalité">Demande de fonctionnalité</option>
              <option value="Facturation / Licence">Facturation / Licence</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              placeholder="Décrivez votre demande…"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {status === "error" && (
            <p className="text-red-500 text-sm">
              Une erreur est survenue. Réessayez ou contactez-nous directement.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={status === "loading" || !form.nom || !form.email || !form.sujet || !form.message}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            {status === "loading" ? "Envoi en cours…" : "Envoyer le message"}
          </button>
        </div>
      )}
    </main>
  );
}