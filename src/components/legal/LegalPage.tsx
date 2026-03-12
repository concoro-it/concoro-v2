import Link from 'next/link';

type LegalSection = {
    title: string;
    paragraphs?: string[];
    bullets?: string[];
};

interface LegalPageProps {
    eyebrow: string;
    title: string;
    intro: string;
    updatedAt: string;
    sections: LegalSection[];
}

export function LegalPage({ eyebrow, title, intro, updatedAt, sections }: LegalPageProps) {
    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 8% 8%, rgba(14,78,136,0.14), transparent 34%), radial-gradient(circle at 92% 12%, rgba(30,64,175,0.08), transparent 28%), repeating-linear-gradient(90deg, rgba(10,53,91,0.03) 0 1px, transparent 1px 88px)',
                }}
            />

            <section className="relative border-b border-slate-200/80 px-4 pb-10 pt-12 md:pt-16">
                <div className="container mx-auto max-w-4xl">
                    <div className="inline-flex items-center rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 backdrop-blur-sm">
                        {eyebrow}
                    </div>
                    <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                        {intro}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">Ultimo aggiornamento: {updatedAt}</span>
                        <Link href="/hub/assistenza" className="rounded-full bg-slate-900 px-3 py-1 text-white transition-colors hover:bg-slate-800">
                            Contatta l&apos;assistenza
                        </Link>
                    </div>
                </div>
            </section>

            <section className="relative px-4 py-10 md:py-14">
                <div className="container mx-auto max-w-4xl">
                    <article className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)] backdrop-blur-sm md:p-10">
                        <div className="space-y-8">
                            {sections.map((section) => (
                                <section key={section.title} className="scroll-mt-24 border-b border-slate-200/70 pb-8 last:border-b-0 last:pb-0">
                                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{section.title}</h2>
                                    <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 md:text-[15px]">
                                        {section.paragraphs?.map((paragraph) => (
                                            <p key={paragraph}>{paragraph}</p>
                                        ))}
                                        {section.bullets ? (
                                            <ul className="space-y-3 pl-5">
                                                {section.bullets.map((bullet) => (
                                                    <li key={bullet} className="list-disc">
                                                        {bullet}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </article>
                </div>
            </section>
        </div>
    );
}
