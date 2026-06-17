import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header>
        <NavBar />
      </header>
      {children}
      <Footer />
    </>
  );
}
