import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const limit = parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const from = page * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("data")
    .select("*")
    .order("created_at", { ascending: false })
    .match({ user_id: session.user.id, failed: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    page,
    limit,
    hasMore: (data ?? []).length === limit,
  });
}
