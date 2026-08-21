"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clsx } from "@/lib/clsx";

type LoginFormProps = {
  variant?: "light" | "dark";
};

export function LoginForm({ variant = "light" }: LoginFormProps) {
  const [error, formAction, isPending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const isDark = variant === "dark";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className={clsx("text-sm font-medium", isDark ? "text-white" : "text-c24-navy")}
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@connect24.io"
          required
          variant={variant}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className={clsx("text-sm font-medium", isDark ? "text-white" : "text-c24-navy")}
        >
          Contraseña
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="pr-16"
            variant={variant}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className={clsx(
              "absolute inset-y-0 right-0 px-3 text-xs font-medium",
              isDark ? "text-white/60 hover:text-white" : "text-c24-text-muted hover:text-c24-navy",
            )}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {error && (
        <p
          className={clsx(
            "rounded-md px-3 py-2 text-sm",
            isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-600",
          )}
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} variant={isDark ? "accent" : "primary"}>
        {isPending ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
