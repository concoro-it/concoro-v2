import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { RadarEffectDemo } from "@/components/ui/radar-effect-demo";

type AuthSplitShellProps = {
  children: React.ReactNode;
  heroTitle: string;
};

export function AuthSplitShell({ children, heroTitle }: AuthSplitShellProps) {
  return (
    <div className="h-[100vh] overflow-auto bg-[hsl(210,55%,98%)] px-0 py-0 lg:overflow-hidden [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
      <div className="mx-auto grid h-full w-full overflow-hidden border border-slate-200/80 bg-white lg:grid-cols-2">
        <section
          className="relative hidden min-h-0 flex-col border-b border-slate-200/80 p-6 sm:p-8 lg:flex lg:border-b-0 lg:border-r lg:border-slate-200/80 lg:p-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 8%, rgba(14,47,80,0.17), transparent 35%), radial-gradient(circle at 90% 10%, rgba(16,185,129,0.12), transparent 34%), repeating-linear-gradient(90deg, rgba(10,53,91,0.035) 0 1px, transparent 1px 84px)",
          }}
        >
          <div className="flex items-center justify-start">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/concoro-logo-light.png"
                alt="Concoro"
                width={126}
                height={30}
                className="h-6 w-auto"
                priority
              />
            </Link>
          </div>

          <div className="mt-6 flex flex-1 items-center justify-center overflow-visible">
            <RadarEffectDemo />
          </div>

          <blockquote className="mt-6 border-l-2 border-slate-900/70 pl-4 text-sm leading-relaxed text-slate-700">
            <p className="text-balance [font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-[1.04rem] text-slate-900">
              “{heroTitle}”
            </p>
            <footer className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Team Concoro
            </footer>
          </blockquote>
        </section>

        <section className="relative flex min-h-0 flex-col overflow-auto p-6 sm:p-8 lg:p-10">
          <Link
            href="/"
            className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-slate-900 sm:left-8 sm:top-8 lg:left-10 lg:top-10"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </Link>

          <div className="mx-auto flex w-full max-w-sm flex-1 items-center justify-center pt-12 sm:pt-14 lg:pt-0">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
