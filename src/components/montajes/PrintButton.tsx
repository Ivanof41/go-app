"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

// print:hidden porque este botón es solo para disparar el diálogo del navegador — no
// tiene sentido que aparezca en la hoja impresa/el PDF resultante.
export function PrintButton() {
  return (
    <div className="print:hidden">
      <Button type="button" fullWidth={false} onClick={() => window.print()}>
        <span className="flex items-center gap-1.5">
          <Printer className="h-4 w-4" strokeWidth={1.75} /> Imprimir / Guardar como PDF
        </span>
      </Button>
    </div>
  );
}
