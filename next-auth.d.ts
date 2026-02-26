import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      role?: "ACCOUNTING" | "RECEPTION" | "SALES" | "ADMIN";
      name?: string | null;
      email?: string | null;
    };
  }
}
