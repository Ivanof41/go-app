import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-c24-teal-light">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
