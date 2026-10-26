import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";
import { AvatarUploader } from "@/components/settings/AvatarUploader";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";

export default async function AjustesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-semibold text-c24-navy">Ajustes</h1>
      <p className="mt-1 text-sm text-c24-text-muted">Gestiona tu perfil y tu contraseña.</p>

      <Card light title="Foto de perfil" className="mt-8">
        <AvatarUploader currentAvatar={user.avatar} name={user.name} />
      </Card>

      <Card light title="Datos personales" className="mt-6">
        <ProfileForm defaultName={user.name} defaultEmail={user.email} />
      </Card>

      <Card light title="Cambiar contraseña" className="mt-6">
        <PasswordForm />
      </Card>
    </div>
  );
}
