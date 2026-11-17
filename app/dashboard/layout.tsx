import Navbar from "./_components/navbar";
import { CartProvider } from "./_components/cart-context";
import BuyerBottomNav from "./_components/bottom-nav";
import PlatformBanner from "@/components/ui/platform-banner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen w-full flex-1 flex-col bg-app font-mont text-ink">
        <Navbar />
        <PlatformBanner audience="buyer" />
        <main className="pb-bottom-nav w-full flex-1 overflow-x-clip">{children}</main>
        <BuyerBottomNav />
      </div>
    </CartProvider>
  );
}
