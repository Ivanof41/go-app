"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePasswordAction } from "@/app/(protected)/ajustes/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, undefined);
  const [showPasswords, setShowPasswords] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  const type = showPasswords ? "text" : "password";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="text-sm font-medium text-c24-navy">
          Contraseña actual
        </label>
        <Input id="currentPassword" name="currentPassword" type={type} autoComplete="current-password" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium text-c24-navy">
          Nueva contraseña
        </label>
        <Input id="newPassword" name="newPassword" type={type} autoComplete="new-password" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-c24-navy">
          Confirmar nueva contraseña
        </label>
        <Input id="confirmPassword" name="confirmPassword" type={type} autoComplete="new-password" required />
      </div>

      <button
        type="button"
        onClick={() => setShowPasswords((v) => !v)}
        className="self-start text-xs font-medium text-c24-text-muted hover:text-c24-navy"
      >
        {showPasswords ? "Ocultar contraseñas" : "Mostrar contraseñas"}
      </button>

      {state?.error && (
        <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-c24-teal-light px-3 py-2 text-sm text-c24-teal-dark">
          {state.success}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          fullWidth={false}
          className="w-36"
          onClick={() => formRef.current?.reset()}
        >
          Cancelar
        </Button>
        <Button type="submit" fullWidth={false} className="w-36" disabled={isPending}>
          {isPending ? "Actualizando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
