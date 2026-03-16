import './globals.css';
import { getSiteConfig } from '@/lib/directus';
import Navbar from '@/components/layout/Navbar';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import PageLoader from '@/components/ui/PageLoader';
import ScrollProgress from '@/components/ui/ScrollProgress';

export async function generateMetadata() {
  const config = await getSiteConfig();
  const { site } = config;

  return {
    title: {
      default: `${site.name} — ${site.tagline}`,
      template: `%s — ${site.name}`,
    },
    description: site.description,
    keywords: ['MARFA', 'Bolivia', 'laguna natural', 'camping', 'eventos privados', 'ecoturismo', 'naturaleza'],
    authors: [{ name: site.name }],
    openGraph: {
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://marfabolivia.com',
      siteName: site.name,
      images: [
        {
          url: '/assets/img_lagoon_wide.jpg',
          width: 1200,
          height: 630,
          alt: 'Laguna natural de MARFA',
        },
      ],
      locale: 'es_BO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
      images: ['/assets/img_lagoon_wide.jpg'],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  };
}

export default async function RootLayout({ children }) {
  const config = await getSiteConfig();

  return (
    <html lang="es">
      <body>
        {/* Page Loader — fades out after fonts/assets are ready */}
        <PageLoader wordmark={config.site.name} />

        {/* Scroll progress indicator */}
        <ScrollProgress />

        {/* Site navigation */}
        <Navbar config={config} />

        {/* Main content */}
        <main>{children}</main>

        {/* Persistent WhatsApp CTA */}
        <WhatsAppFloat config={config} />
      </body>
    </html>
  );
}
