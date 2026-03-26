"use client";

import Image from "next/image";
import { Radar } from "@/components/ui/radar-effect";

type PartnerLogo = {
  src: string;
  alt: string;
};

const topRow: PartnerLogo[] = [
  { src: "/partners/roma.svg", alt: "Comune di Roma" },
  { src: "/partners/milano.svg", alt: "Comune di Milano" },
  { src: "/partners/inps.svg", alt: "INPS" },
];

const middleRow: PartnerLogo[] = [
  { src: "/partners/inpa.svg", alt: "inPA" },
  { src: "/partners/ferrovie.svg", alt: "Ferrovie dello Stato" },
];

const bottomRow: PartnerLogo[] = [
  { src: "/partners/agenzia.svg", alt: "Agenzia delle Entrate" },
];

function LogoCard({ src, alt }: PartnerLogo) {
  return (
    <div className="relative z-20 flex h-14 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.55)] sm:h-16 sm:w-20">
      <Image
        src={src}
        alt={alt}
        width={84}
        height={48}
        className="h-auto max-h-9 w-full object-contain sm:max-h-10"
      />
    </div>
  );
}

export function RadarEffectDemo() {
  return (
    <div className="relative w-full px-2 py-6 sm:px-4 sm:py-8">
      <div className="relative mx-auto flex h-[25rem] max-w-xl flex-col items-center space-y-5 overflow-hidden pt-6 sm:h-[28rem] sm:pt-8">
        <div className="relative z-20 flex w-full items-center justify-center gap-6 sm:justify-between sm:gap-3">
          {topRow.map((logo) => (
            <LogoCard key={logo.src} {...logo} />
          ))}
        </div>

        <div className="relative z-20 flex w-full max-w-sm items-center justify-center gap-8 sm:justify-between sm:gap-3">
          {middleRow.map((logo) => (
            <LogoCard key={logo.src} {...logo} />
          ))}
        </div>

        <div className="relative z-20 flex w-full max-w-[5rem] items-center justify-center">
          {bottomRow.map((logo) => (
            <LogoCard key={logo.src} {...logo} />
          ))}
        </div>

        <Radar className="absolute left-1/2 top-[106%] z-0 -translate-x-1/2 -translate-y-1/2 sm:top-[104%]" />
      </div>
    </div>
  );
}
