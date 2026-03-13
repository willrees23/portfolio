import Navbar from "@/components/navbar";
import { Analytics } from "@vercel/analytics/next";

export default function PortfolioLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4">
        {children}
      </main>
      <Analytics />
    </>
  );
}
