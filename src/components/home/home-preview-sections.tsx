import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Camera,
  Check,
  GraduationCap,
  Megaphone,
  MoveRight,
  Package2,
  PanelsTopLeft,
  Trophy,
  UsersRound
} from "lucide-react";

import { AlbumCard } from "@/components/dashboard/album-card";
import { HomePreviewContactForm } from "@/components/home/home-preview-contact-form";
import { HomePreviewLogoMarquee } from "@/components/home/home-preview-logo-marquee";
import { Button } from "@/components/ui/button";
import type { AlbumSummary } from "@/features/albums/types";

const navItems = [
  { href: "#propuesta", label: "Propuesta" },
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Proceso" },
  { href: "#galerias", label: "Galerias" },
  { href: "#contacto", label: "Contacto" }
] as const;

const valueHighlights = [
  {
    title: "Narrativa visual con intencion",
    copy: "No se trata solo de verse bien. Se trata de decir algo con forma y con sentido."
  },
  {
    title: "Procesos creativos mas humanos",
    copy: "Trabajamos desde la escucha, el contexto y la energia real de cada proyecto."
  },
  {
    title: "Entregas con estilo propio",
    copy: "La experiencia final tambien cuenta: orden, presencia y una entrega cuidada."
  }
] as const;

const services = [
  {
    icon: Camera,
    emoji: "📸",
    title: "Documental social",
    copy: "Historias, procesos y personas contadas con sensibilidad y verdad."
  },
  {
    icon: Trophy,
    emoji: "🏃",
    title: "Fotografia deportiva",
    copy: "Coberturas con energia, ritmo y precision para eventos y comunidades en movimiento."
  },
  {
    icon: Megaphone,
    emoji: "📣",
    title: "Comunicacion organizacional",
    copy: "Narrativas mas claras, humanas y coherentes para equipos, marcas y proyectos."
  },
  {
    icon: GraduationCap,
    emoji: "🧠",
    title: "Talleres y experiencias",
    copy: "Espacios para aprender haciendo, pensar en colectivo y activar ideas."
  },
  {
    icon: UsersRound,
    emoji: "🤝",
    title: "Habilidades blandas",
    copy: "Procesos para fortalecer escucha, liderazgo, vinculo y colaboracion."
  },
  {
    icon: Package2,
    emoji: "🪄",
    title: "Merch y produccion",
    copy: "Ideas que salen de pantalla y se convierten en piezas con presencia real."
  }
] as const;

const processSteps = [
  {
    number: "01",
    title: "Escuchamos",
    copy: "Leemos el contexto, la energia del proyecto y lo que de verdad importa contar."
  },
  {
    number: "02",
    title: "Disenamos la narrativa",
    copy: "Aterrizamos una direccion visual y discursiva para que todo tenga coherencia."
  },
  {
    number: "03",
    title: "Producimos",
    copy: "Salimos a documentar, facilitar, cubrir o fabricar con criterio, ritmo y cuidado."
  },
  {
    number: "04",
    title: "Entregamos con estilo",
    copy: "El resultado se entiende rapido, se siente propio y se entrega con presencia."
  }
] as const;

const trustCards = [
  {
    metric: "XX+",
    title: "proyectos documentados",
    copy: "Reemplaza este numero con volumen real cuando quieras."
  },
  {
    metric: "XX+",
    title: "coberturas y experiencias",
    copy: "Eventos, talleres, procesos y activaciones con sello propio."
  },
  {
    metric: "1",
    title: "plataforma propia",
    copy: "Galerias premium, favoritas, descargas y una experiencia de entrega mas cuidada."
  }
] as const;

const galleryBenefits = [
  "acceso simple para clientes",
  "entrega con estilo y orden",
  "experiencia mas cuidada"
] as const;

const collaboratorLogos = [
  "carrera celuver",
  "30s meli",
  "barre cowgirl party",
  "tizzy session",
  "comunidades en movimiento",
  "equipos y talleres",
  "marcas con caracter",
  "experiencias la kja"
] as const;

function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left"
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-4xl text-center" : "max-w-3xl space-y-4"}>
      <p className="text-xs font-black uppercase tracking-[0.34em] text-[#20211d]/40 dark:text-white/40">{eyebrow}</p>
      <h2 className="text-[2.3rem] font-black uppercase leading-[0.84] tracking-[-0.06em] text-[#20211d] dark:text-white md:text-[4.4rem]">
        {title}
      </h2>
      {copy ? <p className="max-w-2xl text-base leading-8 text-[#20211d]/68 dark:text-white/68">{copy}</p> : null}
    </div>
  );
}

function ServiceCard({
  icon: Icon,
  emoji,
  title,
  copy,
  tone = "light"
}: {
  icon: LucideIcon;
  emoji: string;
  title: string;
  copy: string;
  tone?: "light" | "dark" | "green";
}) {
  const toneClasses =
    tone === "dark"
      ? "border-transparent bg-[#20211d] text-white shadow-[0_16px_28px_rgba(15,23,42,0.12)]"
      : tone === "green"
        ? "border-transparent bg-[#5aab14] text-white shadow-[0_16px_28px_rgba(90,171,20,0.16)]"
        : "border-black/10 bg-white text-[#20211d] shadow-[0_12px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#151821] dark:text-white";

  return (
    <article
      className={`rounded-[34px] border px-5 py-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(15,23,42,0.08)] ${toneClasses}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-current/12 bg-black/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] dark:bg-white/10">
          <span className="text-base leading-none">{emoji}</span>
          <span>servicio</span>
        </span>
        <div className="inline-flex rounded-[16px] bg-black/6 p-3 dark:bg-white/10">
          <Icon className="size-5" />
        </div>
      </div>
      <h3 className="mt-5 text-[1.8rem] font-black uppercase leading-[0.9] tracking-[-0.05em]">{title}</h3>
      <p className="mt-3 text-sm leading-7 opacity-84">{copy}</p>
    </article>
  );
}

export function HeroSection({
  heroMain,
  heroSecond,
  heroThird,
  contactHref
}: {
  heroMain: string;
  heroSecond: string;
  heroThird: string;
  contactHref: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[42px] border border-black/10 bg-[#f6f1e7] px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f1014] md:px-7 md:py-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(90,171,20,0.07),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(240,24,110,0.06),transparent_22%)]" />
      <div className="pointer-events-none absolute -left-8 top-28 hidden h-20 w-20 rotate-[-14deg] rounded-[24px] border-[7px] border-[#20211d] md:block dark:border-white/70" />
      <div className="pointer-events-none absolute right-12 top-24 hidden h-16 w-16 rounded-full border-[10px] border-[#ffe000] md:block" />
      <div className="pointer-events-none absolute bottom-20 right-[16%] hidden h-3 w-28 rounded-full bg-[#f0186e] md:block" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-full border border-black/10 bg-white/82 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-full bg-white">
            <Image src="/branding/lakja-logo.svg" alt="La Kja" fill className="object-contain p-1.5" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#20211d]/40 dark:text-white/40">
            LaKja Casa Creativa
          </p>
        </div>
        <nav className="hidden flex-wrap items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#20211d]/70 transition hover:border-[#5aab14] hover:text-[#20211d] dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-[#5aab14] dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="relative mt-10 grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#20211d]/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              LaKja Casa Creativa
            </p>
            <h1 className="max-w-4xl text-[3rem] font-black uppercase leading-[0.82] tracking-[-0.065em] text-[#20211d] dark:text-white md:text-[5.8rem]">
              Hacemos un ching%4! de cosas.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[#20211d]/68 dark:text-white/68">
              Documentamos, disenamos y acompanamos historias, procesos y personas con una mirada viva, humana y visual.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={contactHref} target="_blank" rel="noreferrer">
              <Button className="min-h-12 bg-[#20211d] px-6 text-white shadow-[0_14px_22px_rgba(32,33,29,0.22)] hover:bg-black">
                Abrir proyecto
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </a>
            <Link href="/">
              <Button variant="secondary" className="min-h-12 border-black/10 bg-white px-6 text-[#20211d] hover:border-[#5aab14]">
                Ver galerias
              </Button>
            </Link>
          </div>

          <div className="flex max-w-2xl flex-wrap gap-2.5">
            {["mas collage", "menos brochure", "historias con cuerpo"].map((item, index) => (
              <span
                key={item}
                className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] ${
                  index === 0
                    ? "bg-[#5aab14] text-white"
                    : index === 2
                      ? "bg-[#20211d] text-white dark:bg-white dark:text-[#20211d]"
                      : "border border-black/10 bg-white text-[#20211d] dark:border-white/10 dark:bg-white/5 dark:text-white"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-h-[660px]">
          <div className="absolute left-[4%] top-8 w-[56%] rotate-[-6deg] rounded-[38px] border border-black/10 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-[#16181f]">
            <div className="h-[390px] rounded-[30px] bg-cover bg-center grayscale-[0.04]" style={{ backgroundImage: `url(${heroMain})` }} />
          </div>

          <div className="absolute right-[2%] top-0 w-[42%] rounded-[32px] border border-black/10 bg-[#20211d] px-6 py-6 text-white shadow-[0_18px_30px_rgba(15,23,42,0.16)]">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/42">Lo que hacemos</p>
            <p className="mt-3 text-[2rem] font-black uppercase leading-[0.88] tracking-[-0.05em]">
              Narrativa visual.
              <span className="block text-[#ffe000]">Procesos.</span>
              <span className="block">Personas.</span>
            </p>
          </div>

          <div className="absolute right-[10%] top-[38%] w-[40%] rounded-[30px] border border-black/10 bg-white px-5 py-5 text-[#20211d] shadow-[0_14px_26px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#16181f] dark:text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#20211d]/40 dark:text-white/40">Valor</p>
            <p className="mt-3 text-[1.4rem] font-black uppercase leading-[0.94] tracking-[-0.05em]">
              impacto visual,
              <span className="block text-[#f0186e]">claridad comercial</span>
              <span className="block">y estilo propio.</span>
            </p>
          </div>

          <div className="absolute left-[12%] bottom-12 w-[36%] rotate-[4deg] rounded-[28px] border border-black/10 bg-white p-2 shadow-[0_16px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#16181f]">
            <div className="h-[170px] rounded-[22px] bg-cover bg-center" style={{ backgroundImage: `url(${heroSecond})` }} />
          </div>

          <div className="absolute right-[12%] bottom-0 w-[30%] rotate-[-8deg] rounded-[28px] border border-black/10 bg-[#f0186e] p-2 shadow-[0_18px_28px_rgba(240,24,110,0.18)]">
            <div className="h-[146px] rounded-[22px] bg-cover bg-center" style={{ backgroundImage: `url(${heroThird})` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ValueSection({ valuePhoto }: { valuePhoto: string }) {
  return (
    <section id="propuesta" className="space-y-8">
      <SectionHeading
        eyebrow="Propuesta de valor"
        title="LaKja es una casa creativa para historias, procesos y marcas que necesitan algo mas que contenido bonito."
        copy="Traducimos la vibra en piezas, coberturas, experiencias y narrativas visuales que conectan mejor con las personas correctas."
      />

      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="space-y-4">
          {valueHighlights.map((item, index) => (
            <div
              key={item.title}
              className={`rounded-[28px] border px-5 py-5 shadow-[0_10px_18px_rgba(15,23,42,0.04)] ${
                index === 1
                  ? "border-transparent bg-[#20211d] text-white"
                  : "border-black/10 bg-white text-[#20211d] dark:border-white/10 dark:bg-[#151821] dark:text-white"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full ${index === 1 ? "bg-white/12" : "bg-[#5aab14]/12"}`}>
                  <Check className={`size-4 ${index === 1 ? "text-white" : "text-[#5aab14]"}`} />
                </span>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-[0.08em]">{item.title}</h3>
                  <p className={`mt-2 text-sm leading-7 ${index === 1 ? "text-white/72" : "text-[#20211d]/66 dark:text-white/66"}`}>{item.copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative min-h-[420px]">
          <div className="absolute left-[8%] top-5 w-[64%] rotate-[-4deg] rounded-[34px] border border-black/10 bg-white p-3 shadow-[0_18px_34px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#151821]">
            <div className="h-[300px] rounded-[26px] bg-cover bg-center grayscale-[0.04]" style={{ backgroundImage: `url(${valuePhoto})` }} />
          </div>
          <div className="absolute right-[2%] top-0 w-[40%] rounded-[28px] bg-[#ffe000] px-5 py-5 text-[#20211d] shadow-[0_18px_28px_rgba(255,224,0,0.16)]">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#20211d]/48">Para quien</p>
            <p className="mt-3 text-[1.45rem] font-black uppercase leading-[0.92] tracking-[-0.05em]">
              marcas
              <span className="block">equipos</span>
              <span className="block">proyectos</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServicesSection() {
  return (
    <section id="servicios" className="space-y-8">
      <SectionHeading
        eyebrow="Servicios / universo LaKja"
        title="Entramos por distintos frentes, pero siempre trabajamos con la misma intencion."
        copy="Cada servicio esta pensado como una solucion viva: con criterio visual, claridad y una manera propia de hacer las cosas."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service, index) => (
          <ServiceCard
            key={service.title}
            {...service}
            tone={index === 1 ? "dark" : index === 5 ? "green" : "light"}
          />
        ))}
      </div>
    </section>
  );
}

export function ProcessSection() {
  return (
    <section
      id="proceso"
      className="rounded-[42px] border border-black/10 bg-[#f6f1e7] px-6 py-8 shadow-[0_18px_38px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#12141a] md:px-8 md:py-10"
    >
      <SectionHeading
        eyebrow="Como trabajamos"
        title="Tenemos metodo, aunque no huelamos a brochure corporativo."
        copy="Un proceso claro da confianza. Un proceso sensible hace que el resultado se sienta mucho mejor."
        align="center"
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-4">
        {processSteps.map((step, index) => (
          <article
            key={step.number}
            className={`rounded-[30px] border px-5 py-5 ${
              index === 1
                ? "border-transparent bg-[#20211d] text-white shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
                : index === 2
                  ? "border-transparent bg-[#5aab14] text-white shadow-[0_16px_30px_rgba(90,171,20,0.14)]"
                  : "border-black/10 bg-white text-[#20211d] shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#151821] dark:text-white"
            }`}
          >
            <p
              className={`text-[3.2rem] font-black uppercase leading-none tracking-[-0.06em] ${
                index === 1 || index === 2 ? "text-white/18" : "text-[#20211d]/16 dark:text-white/14"
              }`}
            >
              {step.number}
            </p>
            <h3 className="mt-4 text-[1.4rem] font-black uppercase leading-[0.92] tracking-[-0.04em]">{step.title}</h3>
            <p className={`mt-3 text-sm leading-7 ${index === 1 || index === 2 ? "text-white/72" : "text-[#20211d]/66 dark:text-white/66"}`}>
              {step.copy}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TrustSection() {
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Prueba / confianza"
        title="No solo queremos vernos bien. Queremos que se note que sabemos sostener un proyecto."
        copy="Deja aqui tus numeros, casos o testimonios. Mientras tanto, la estructura ya trabaja como espacio de credibilidad."
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#20211d]/40 dark:text-white/40">Con quienes hemos vibrado</p>
          <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#20211d]/66 dark:border-white/10 dark:bg-[#151821] dark:text-white/66">
            logos / proyectos
          </span>
        </div>
        <HomePreviewLogoMarquee items={collaboratorLogos} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="grid gap-4 md:grid-cols-3">
          {trustCards.map((card, index) => (
            <article
              key={card.title}
              className={`rounded-[32px] border px-5 py-5 ${
                index === 1
                  ? "border-transparent bg-[#20211d] text-white shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
                  : "border-black/10 bg-white text-[#20211d] shadow-[0_12px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#151821] dark:text-white"
              }`}
            >
              <p className={`text-[3rem] font-black uppercase leading-none tracking-[-0.06em] ${index === 1 ? "text-[#ffe000]" : "text-[#5aab14]"}`}>
                {card.metric}
              </p>
              <h3 className="mt-4 text-[1.1rem] font-black uppercase tracking-[0.08em]">{card.title}</h3>
              <p className={`mt-3 text-sm leading-7 ${index === 1 ? "text-white/72" : "text-[#20211d]/66 dark:text-white/66"}`}>{card.copy}</p>
            </article>
          ))}
        </div>

        <div className="rounded-[36px] border border-black/10 bg-[#f6f1e7] px-6 py-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#12141a]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#20211d]/40 dark:text-white/40">Frase de confianza</p>
          <p className="mt-4 text-[2rem] font-black uppercase leading-[0.9] tracking-[-0.05em] text-[#20211d] dark:text-white">
            No solo hacemos piezas bonitas. Construimos experiencias visuales que conectan, organizan y permanecen.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {["marcas y equipos", "eventos y comunidades", "proyectos con sensibilidad documental", "plataforma propia de entrega"].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-black/10 bg-white px-4 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#20211d] dark:border-white/10 dark:bg-[#1a1c24] dark:text-white"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function GalleryPlatformSection({ albums }: { albums: AlbumSummary[] }) {
  return (
    <section id="galerias" className="space-y-8">
      <SectionHeading
        eyebrow="Plataforma de galerias"
        title="La plataforma sigue viva. Y sigue siendo uno de los productos mas fuertes de LaKja."
        copy="No esta escondida ni sobra. Es una forma premium de entregar historias, coberturas y selecciones con una experiencia mas cuidada."
      />

      <div className="grid gap-8 xl:grid-cols-[0.76fr_1.24fr] xl:items-center">
        <div className="space-y-5">
          <div className="rounded-[34px] border border-black/10 bg-white px-5 py-5 shadow-[0_12px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#151821]">
            <div className="inline-flex rounded-full bg-[#20211d] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white">
              producto premium
            </div>
            <p className="mt-4 text-[2.1rem] font-black uppercase leading-[0.9] tracking-[-0.05em] text-[#20211d] dark:text-white">
              Acceso simple, entrega con estilo y una experiencia de seleccion mucho mejor resuelta.
            </p>
          </div>

          <div className="grid gap-3">
            {galleryBenefits.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#20211d] shadow-[0_10px_18px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#151821] dark:text-white"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5aab14]/12">
                  <PanelsTopLeft className="size-4 text-[#5aab14]" />
                </span>
                {item}
              </div>
            ))}
          </div>

          <Link href="/">
            <Button className="min-h-12 bg-[#20211d] px-6 text-white hover:bg-black">
              Entrar a galerias
              <MoveRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>

        <div className="rounded-[40px] border border-black/10 bg-[#20211d] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.16)] dark:border-white/10">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-3 backdrop-blur">
            <div className="flex items-center gap-2 px-2 pb-3">
              <span className="h-3 w-3 rounded-full bg-[#f0186e]" />
              <span className="h-3 w-3 rounded-full bg-[#ffe000]" />
              <span className="h-3 w-3 rounded-full bg-[#5aab14]" />
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {albums.map((album, index) => (
                <div key={album.id} className={index === 1 ? "md:-translate-y-6" : ""}>
                  <AlbumCard album={album} variant="showcase" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCTASection({
  contactPhoto,
  contactHref,
  instagramUrl,
  whatsappNumber,
  whatsappMessage
}: {
  contactPhoto: string;
  contactHref: string;
  instagramUrl: string;
  whatsappNumber: string;
  whatsappMessage: string;
}) {
  return (
    <section
      id="contacto"
      className="relative overflow-hidden rounded-[40px] border border-black/10 bg-[#20211d] px-6 py-8 text-white shadow-[0_18px_38px_rgba(15,23,42,0.16)] dark:border-white/10 md:px-8 md:py-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(90,171,20,0.13),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(240,24,110,0.1),transparent_22%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="space-y-5">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-white/42">CTA final</p>
          <h2 className="max-w-4xl text-[2.5rem] font-black uppercase leading-[0.86] tracking-[-0.05em] md:text-[4.8rem]">
            Si ya te hizo sentido, hagamos algo juntos.
          </h2>
          <p className="max-w-2xl text-base leading-8 text-white/70">
            Tu historia no necesita mas contenido. Necesita cuerpo, claridad y una forma de entregarse bien.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={contactHref} target="_blank" rel="noreferrer">
              <Button className="min-h-12 bg-[#5aab14] px-6 text-white hover:bg-[#4f9913]">
                Abrir proyecto
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </a>
            <a href={instagramUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="min-h-12 border-white/14 bg-white/7 px-6 text-white hover:border-white/30 hover:text-white">
                Escribirnos
              </Button>
            </a>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white p-3 shadow-[0_12px_24px_rgba(0,0,0,0.1)]">
            <div
              className="h-[250px] rounded-[24px] bg-cover bg-center grayscale-[0.04] transition duration-500 hover:scale-[1.02]"
              style={{ backgroundImage: `url(${contactPhoto})` }}
            />
            <div className="absolute left-6 top-6 rounded-full bg-[#20211d] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white">
              listo para volverse home.lakja.top
            </div>
          </div>
        </div>

        <div className="rounded-[34px] border border-white/10 bg-white/6 p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/42">Formulario de contacto</p>
              <h3 className="mt-2 text-[2rem] font-black uppercase leading-[0.9] tracking-[-0.05em]">
                Abramos la conversacion con algo mas que un hola.
              </h3>
            </div>
            <span className="rounded-full bg-[#f0186e] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white">
              briefing rapido
            </span>
          </div>

          <div className="mt-6">
            <HomePreviewContactForm whatsappNumber={whatsappNumber} defaultMessage={whatsappMessage} />
          </div>
        </div>
      </div>
    </section>
  );
}
