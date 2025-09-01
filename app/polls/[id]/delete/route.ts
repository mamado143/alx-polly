import { deletePollAndRedirect } from "@/lib/actions/delete-poll";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await deletePollAndRedirect(params.id);
  
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // The redirect will be handled by the server action
  return new Response(null, { status: 200 });
}
