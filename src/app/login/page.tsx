import Image from "next/image";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden">
      <div
        className="halo-glow pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-72 -translate-x-1/2 md:block"
        style={{
          background:
            "radial-gradient(closest-side, rgba(106,181,171,0.95) 0%, rgba(106,181,171,0.5) 40%, transparent 72%)",
          filter: "blur(28px)",
        }}
      />
      <div
        className="halo-glow pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-1 -translate-x-1/2 md:block"
        style={{
          background: "rgba(106,181,171,0.9)",
          filter: "blur(3px)",
        }}
      />

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
