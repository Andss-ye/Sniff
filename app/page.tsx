import "./landing.css";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FooterSection from "@/components/landing/FooterSection";

export default function Home() {
  return (
    <div className="landing">
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <FooterSection />
    </div>
  );
}
