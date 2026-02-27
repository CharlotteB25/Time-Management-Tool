import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;

export const runtime = "nodejs"; // ✅ important: NextAuth needs Node
export const dynamic = "force-dynamic";
