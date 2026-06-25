import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// POST { studentEmail, studentName, projectName } -> creates (or reuses) a
// student record and starts a new mentor session.
export async function POST(req: NextRequest) {
  try {
    const { studentEmail, studentName, projectName } = (await req.json()) as {
      studentEmail: string;
      studentName: string;
      projectName?: string;
    };

    if (!studentEmail || !studentName) {
      return NextResponse.json(
        { error: "studentEmail and studentName are required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    const { data: student, error: studentErr } = await supabase
      .from("students")
      .upsert({ email: studentEmail, full_name: studentName }, { onConflict: "email" })
      .select("id")
      .single();
    if (studentErr) throw studentErr;

    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .insert({ student_id: student.id, project_name: projectName ?? null })
      .select("id")
      .single();
    if (sessionErr) throw sessionErr;

    return NextResponse.json({ sessionId: session.id, studentId: student.id });
  } catch (err: unknown) {
    console.error("/api/session error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
