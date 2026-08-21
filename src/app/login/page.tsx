import Image from "next/image";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex justify-center md:hidden">
            <Image src="/LogoOnlyGo.png" alt="Go!" width={56} height={35} />
          </div>

          <h1 className="mb-1 text-2xl font-semibold text-c24-navy">Bienvenido</h1>
          <p className="mb-8 text-sm text-c24-text-muted">Inicia sesión para continuar</p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
