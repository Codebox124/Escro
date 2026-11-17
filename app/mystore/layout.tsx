import { SidebarProvider } from "@/components/ui/sidebar";
import StoreSidebar from "./_components/sidebar";
import Navbar from "./_components/navbar";
import { CurrencyProvider } from "./_components/currency";
import SellerBottomNav from "./_components/bottom-nav";
import PlatformBanner from "@/components/ui/platform-banner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <SidebarProvider className="font-mont bg-app">
        <StoreSidebar />
        <div className="flex min-w-0 flex-1 flex-col w-full bg-app">
          <Navbar />
          <PlatformBanner audience="seller" />
          <main className="pb-bottom-nav flex-1 min-w-0">{children}</main>
          <SellerBottomNav />
        </div>
      </SidebarProvider>
    </CurrencyProvider>
  );
}
