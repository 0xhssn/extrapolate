import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { GalleryPage } from "@/app/gallery/gallery-page";

const PAGE_SIZE = 20;

export default async function Gallery() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data } = await supabase
    .from("data")
    .select("*")
    .order("created_at", { ascending: false })
    .match({ user_id: session?.user.id || "", failed: false })
    .range(0, PAGE_SIZE - 1);

  return <GalleryPage initialData={data ?? []} pageSize={PAGE_SIZE} />;
}
