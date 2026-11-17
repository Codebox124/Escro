import { SidebarProvider } from "@/components/ui/sidebar";
import CourierSidebar from "./_components/sidebar";
import Navbar from "./_components/navbar";
import CourierBottomNav from "./_components/bottom-nav";
import PlatformBanner from "@/components/ui/platform-banner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="font-mont bg-app">
      <CourierSidebar />
      <div className="flex min-w-0 flex-1 flex-col w-full">
        <Navbar />
        <PlatformBanner audience="courier" />
        <main className="pb-bottom-nav min-w-0 flex-1 overflow-x-clip">{children}</main>
        <CourierBottomNav />
      </div>
    </SidebarProvider>
  );
}
