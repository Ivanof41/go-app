import Image from "next/image";

const FEATURES = [
  "Inventario en tiempo real",
  "Control de montajes",
  "Reportes automáticos",
];

export function BrandPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-white px-16 text-center md:flex">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-10 blur-3xl"
        style={{ background: "#6ab5ab" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full opacity-[0.08] blur-3xl"
        style={{ background: "#003c5b" }}
      />

      <div className="relative flex flex-col items-center">
        <Image
          src="/LogoGO.png"
          alt="Go! — Connect24"
          width={200}
          height={172}
          className="mb-10"
        />

        <ul className="flex flex-col items-center gap-4">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm text-c24-navy">
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="shrink-0 text-c24-teal"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
      <path
        d="M6.3 10.4l2.3 2.3 5-5.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
