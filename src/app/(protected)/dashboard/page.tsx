import { auth, signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-medium text-c24-navy">
        Bienvenido, {session?.user?.name}
      </h1>
      <p className="text-c24-text-muted">
        Etapa 1 completada: login funcionando. El inventario y los montajes llegarán aquí.
      </p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="rounded-md border border-c24-border px-4 py-2 text-sm text-c24-navy transition hover:bg-c24-teal-light"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
