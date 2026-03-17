import type { Metadata } from "next";

import "@/app/globals.css";
import { IntroSplash } from "@/components/ui/intro-splash";
import { SiteHeader } from "@/components/ui/site-header";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings, resolveSiteShareImageUrl } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const shareImageUrl = resolveSiteShareImageUrl(settings.shareImageUrl);

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? siteConfig.url),
    title: settings.shareTitle,
    description: settings.shareDescription,
    openGraph: {
      type: "website",
      url: siteConfig.url,
      title: settings.shareTitle,
      description: settings.shareDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: shareImageUrl,
          alt: settings.shareTitle
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: settings.shareTitle,
      description: settings.shareDescription,
      images: [shareImageUrl]
    }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <IntroSplash />
        <div className="relative mx-auto min-h-screen max-w-[1380px] px-3 py-3 sm:px-5 sm:py-5 lg:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[360px] max-w-5xl rounded-[90px] bg-[radial-gradient(circle_at_center,rgba(130,198,69,0.08),rgba(255,255,255,0)_70%)] blur-2xl" />
          <SiteHeader />
          <main className="py-5 md:py-8">{children}</main>
          <WhatsAppFloat whatsappNumber={settings.whatsappNumber} defaultMessage={settings.whatsappMessage} />
        </div>
      </body>
    </html>
  );
}
