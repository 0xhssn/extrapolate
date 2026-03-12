import PhotoPage from "@/app/p/[id]/photo-page";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

// export const revalidate = 1;

// export async function generateStaticParams() {
//   return [];
// }

async function getData(id: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Fetch the photo data
  const { data } = await supabase
    .from("data")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return notFound();

  // Verify user ownership - only the owner can view their photos
  if (!session?.user || data.user_id !== session.user.id) {
    return notFound();
  }

  return data;
}

export default async function Photo({ params }: { params: { id: string } }) {
  const { id } = params;
  const fallbackData = await getData(id);

  return <PhotoPage id={id} data={fallbackData} />;
}
