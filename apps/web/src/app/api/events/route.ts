import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createSSEStream } from "@/lib/sse";


export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  const userId = user?.userId || "anonymous";

  const stream = createSSEStream(userId);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
