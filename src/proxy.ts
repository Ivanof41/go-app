import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    // Enlace público de instalación (/i/[token]) para el técnico, sin cuenta — la propia
    // página y sus acciones validan el token a mano, no dependen de sesión. Las fotos que
    // esa página muestra también necesitan pasar sin sesión (?token= en la URL, validado
    // adentro de la ruta) — ver canAccessMontajeItemPhoto.
    req.nextUrl.pathname.startsWith("/i/") ||
    req.nextUrl.pathname.startsWith("/api/montajes/uploads") ||
    // El manual de un sensor también puede pedirse desde esa misma página pública, con
    // ?token= — ver canAccessSensorManual.
    req.nextUrl.pathname.startsWith("/api/sensores/manual");

  if (!isLoggedIn && !isAuthRoute) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
