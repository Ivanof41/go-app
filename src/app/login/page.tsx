import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, #ffffff 0%, #f4f9fb 45%, var(--c24-teal-light) 100%)",
      }}
    >
      <div className="w-full max-w-[400px] rounded-[20px] border border-c24-border bg-white p-8 shadow-lg shadow-c24-navy/5">
        <div className="mb-8 flex flex-col items-center gap-2">
          <picture>
            <source srcSet="/logo-dark.svg" media="(prefers-color-scheme: dark)" />
            <img src="/logo-light.svg" alt="Go! — Connect24" width={160} height={48} />
          </picture>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-xs text-c24-text-muted">
          Connect24 · Go!
        </p>
      </div>
    </main>
  );
}
