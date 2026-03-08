import { News, type NewsArticle } from "@/components/ui/sidebar-news";

const DEMO_ARTICLES: NewsArticle[] = [
  {
    href: "https://unsplash.com/photos/person-writing-on-notebook-v9FQR4tbIq8",
    title: "Concorso guide: come prepararsi in 30 giorni",
    summary: "Una checklist pratica per organizzare studio, quiz e simulazioni.",
    image: "/Layer_2-1.svg",
  },
  {
    href: "https://unsplash.com/photos/man-in-white-dress-shirt-using-macbook-pro-while-sitting-on-chair-in-front-of-table-EhTcC9sYXsw",
    title: "Nuovi bandi digital PA",
    summary: "Le amministrazioni locali accelerano sulle assunzioni in area IT.",
    image: "/Layer_2-2.svg",
  },
  {
    href: "https://unsplash.com/photos/turned-on-gray-laptop-computer-rVGfG1d8j6Y",
    title: "Quiz banca dati: 5 errori da evitare",
    summary: "Ottimizza la preparazione con tecniche di ripasso ad alta resa.",
    image: "/Layer_2.svg",
  },
];

export function NewsDemo() {
  return (
    <div className="relative h-[600px] w-56 bg-gradient-to-br from-background to-muted">
      <div className="absolute bottom-0 left-1/2 w-56 -translate-x-1/2">
        <News articles={DEMO_ARTICLES} />
      </div>
    </div>
  );
}
