import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { nom, email, sujet, message } = await req.json();

    if (!nom || !email || !sujet || !message) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    // 1. Sauvegarde Supabase
    const { error: dbError } = await supabase
      .from("contacts")
      .insert([{ nom, email, sujet, message }]);

    if (dbError) throw dbError;

    // 2. Envoi email
    await resend.emails.send({
      from: "SimuImmo <onboarding@resend.dev>",
      to: ["ft.bu+feedback@ik.me"],
      replyTo: email,
      subject: `[SimuImmo] ${sujet}`,
      text: `Nouveau message de : ${nom} <${email}>\n\nSujet : ${sujet}\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}