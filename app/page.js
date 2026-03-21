import { getSiteConfig } from '@/lib/directus';
import HeroSection        from '@/components/sections/HeroSection';
import StatementSection   from '@/components/sections/StatementSection';
import AboutSection       from '@/components/sections/AboutSection';
import LagoonSection      from '@/components/sections/LagoonSection';
import ExperiencesSection from '@/components/sections/ExperiencesSection';
import AsadoresSection    from '@/components/sections/AsadoresSection';
import CampingSection     from '@/components/sections/CampingSection';
import WhySection         from '@/components/sections/WhySection';
import GallerySection     from '@/components/sections/GallerySection';
import VideoSection       from '@/components/sections/VideoSection';
import BookingSection     from '@/components/sections/BookingSection';
import VisionSection      from '@/components/sections/VisionSection';
import FooterSection      from '@/components/layout/FooterSection';

/**
 * Home page — server component.
 * Fetches all content via getSiteConfig() (local or Directus),
 * then passes relevant slices to each section component.
 */
export default async function HomePage() {
  const config = await getSiteConfig();

  return (
    <>
      <HeroSection        data={config.hero}        site={config.site} />
      <StatementSection   data={config.statement} />
      <AboutSection       data={config.about}       site={config.site} />
      <LagoonSection      data={config.lagoon} />
      <ExperiencesSection data={config.experiences} site={config.site} />
      <AsadoresSection    data={config.asadores}    site={config.site} />
      <CampingSection     data={config.camping}     site={config.site} />
      <WhySection         data={config.why} />
      <GallerySection     data={config.gallery} />
      <VideoSection       data={config.video} />
      <BookingSection     data={config.booking}     site={config.site} />
      <VisionSection      data={config.vision} />
      <FooterSection      site={config.site} />
    </>
  );
}
