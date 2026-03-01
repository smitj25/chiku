import NavBar from "@/components/landing/NavBar";
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
import PlugShowcase from "@/components/landing/PlugShowcase";
import PricingTable from "@/components/landing/PricingTable";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-canvas text-text-secondary font-display relative isolate overflow-x-hidden">
            <NavBar />
            <Hero />
            <StatsBar />
            <HowItWorks />
            <PlugShowcase />
            <PricingTable />
            <CTASection />
            <Footer />
        </div>
    );
}
