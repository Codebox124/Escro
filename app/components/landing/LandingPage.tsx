import LandingNav from "./LandingNav";
import Hero from "./Hero";
import Marquee from "./Marquee";
import Journey from "./Journey";
import Bento from "./Bento";
import Roles from "./Roles";
import Closing from "./Closing";

export default function LandingPage() {
  return (
    <main className="overflow-x-clip bg-[#F4F1EA] font-mont text-[#0C110E] selection:bg-[#C8F169] selection:text-[#0C110E]">
      <LandingNav />
      <Hero />
      <div className="overflow-hidden bg-[#F4F1EA] py-6">
        <Marquee />
      </div>
      <Journey />
      <Bento />
      <Roles />
      <Closing />
    </main>
  );
}
