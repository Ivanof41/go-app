import Image from "next/image";
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
        <div className="mb-6 flex flex-col items-center">
          <Image src="/LogoGO.png" alt="Go! — Connect24" width={200} height={172} priority />
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
