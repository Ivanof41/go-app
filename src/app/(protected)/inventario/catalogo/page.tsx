import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";
import { CatalogSection } from "@/components/inventario/CatalogSection";
import { listBrands, listProviders, listTechnologies } from "@/lib/inventario/queries";
import {
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
  createTechnologyAction,
  updateTechnologyAction,
  deleteTechnologyAction,
  createProviderAction,
  updateProviderAction,
  deleteProviderAction,
} from "@/app/(protected)/inventario/catalogo/actions";

export default async function CatalogoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [brands, technologies, providers] = await Promise.all([
    listBrands(),
    listTechnologies(),
    listProviders(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-c24-navy">Catálogo</h1>
      <p className="mt-1 text-sm text-c24-text-muted">
        Marcas, tecnologías y proveedores usados en los sensores
      </p>

      <Card title="Marcas" className="mt-8">
        <CatalogSection
          items={brands}
          createAction={createBrandAction}
          updateAction={updateBrandAction}
          deleteAction={deleteBrandAction}
          singularLabel="marca"
          addPlaceholder="Nueva marca…"
          emptyLabel="Sin marcas todavía"
        />
      </Card>

      <Card title="Tecnologías" className="mt-6">
        <CatalogSection
          items={technologies}
          createAction={createTechnologyAction}
          updateAction={updateTechnologyAction}
          deleteAction={deleteTechnologyAction}
          singularLabel="tecnología"
          addPlaceholder="Nueva tecnología…"
          emptyLabel="Sin tecnologías todavía"
        />
      </Card>

      <Card title="Proveedores" className="mt-6">
        <CatalogSection
          items={providers}
          createAction={createProviderAction}
          updateAction={updateProviderAction}
          deleteAction={deleteProviderAction}
          singularLabel="proveedor"
          addPlaceholder="Nuevo proveedor…"
          emptyLabel="Sin proveedores todavía"
        />
      </Card>
    </div>
  );
}
