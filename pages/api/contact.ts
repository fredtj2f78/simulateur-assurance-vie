import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { nom, email, sujet, message } = req.body;

    if (!nom || !email || !sujet || !message) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const { error: dbError } = await supabase
      .from("contacts")
      .insert([{ nom, email, sujet, message }]);

    if (dbError) throw dbError;

    await resend.emails.send({
      from: "SimuImmo <onboarding@resend.dev>",
      to: ["ft.bu+feedback@ik.me"],
      replyTo: email,
      subject: `[SimuImmo] ${sujet}`,
      text: `Nouveau message de : ${nom} <${email}>\n\nSujet : ${sujet}\n\n${message}`,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Contact error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
