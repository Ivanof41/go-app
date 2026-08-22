"use client";

import { useActionState, useRef } from "react";
import { updateProfileAction } from "@/app/(protected)/ajustes/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProfileForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-c24-navy">
          Nombre
        </label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-c24-navy">
          Email
        </label>
        <Input id="email" name="email" type="email" defaultValue={defaultEmail} required />
      </div>

      {state?.error && (
        <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-c24-teal-light px-3 py-2 text-sm text-c24-navy">
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
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
