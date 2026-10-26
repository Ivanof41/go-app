import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";
import { MontajeForm } from "@/components/montajes/MontajeForm";

export default async function NuevoMontajePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 py-10">
      <Link
        href="/montajes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-c24-text-muted transition hover:text-c24-navy"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Volver a Montajes
      </Link>

      <Card className="mt-4" light>
        <MontajeForm />
      </Card>
    </div>
  );
}
