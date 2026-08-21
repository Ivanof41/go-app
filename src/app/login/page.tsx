import Image from "next/image";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      <BrandPanel />

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12"
        style={{ background: "linear-gradient(160deg, #003c5b 0%, #001f30 100%)" }}
      >
        <div
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "#6ab5ab" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "#6ab5ab" }}
        />

        <div className="relative w-full max-w-[380px]">
          <div className="mb-8 flex justify-center md:hidden">
            <div className="inline-flex rounded-2xl bg-white/95 p-3 shadow-lg">
              <Image src="/LogoOnlyGo.png" alt="Go!" width={48} height={30} />
            </div>
          </div>

          <h1 className="mb-1 text-2xl font-semibold text-white">Bienvenido</h1>
          <p className="mb-8 text-sm text-white/70">Inicia sesión para continuar</p>

          <LoginForm variant="dark" />
        </div>
      </div>
    </main>
  );
}
