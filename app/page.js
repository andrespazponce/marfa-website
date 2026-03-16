import { getSiteData } from '@lib/directus';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import VisionSection from '@/components/sections/VisionSection';
import ExperiencesSection from '@/components/sections/ExperiencesSection';
import LagoonSection from '@/components/sections/LagoonSection';
import GallerySection from '@/components/sections/GallerySection';
import StatementSection from '@/components/sections/StatementSection';
import VideoSection from '@/components/sections/VideoSection';
import BookingSection from '@/components/sections/BookingSection';
import WhySection from '@/components/sections/WhySection';

export const metadata = {
  title: 'MARFA Lake Resort',
  description: 'Luxury resort located on one of the largest artificial lakes in Bolivia. Surrounded by tropical jengle.',
};

export default async function Home() {
  const data = await getSiteData();

  return (
    <main>
      <HeroSection data={data.hero} />
      <AboutSection data={data.about} />
      <VisionSection data={data.vision} />
      <ExperiencesSection data={data.experiences} />
      <LagoonSection data={data.lagoon} />
      <GallerySection data={data.gallery} />
      <StatementSection data={data.statement} />
      <VideoSection data={data.video} />
      <BookingSection data={data.booking} />
      <WhySection data={data.why} />
    </main>
  );
}
