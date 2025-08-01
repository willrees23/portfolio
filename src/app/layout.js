import { Geist, Geist_Mono, Onest } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Analytics } from "@vercel/analytics/next"

const onest = Onest({ subsets: ["latin"] });

export const metadata = {
  title: "William Rees",
  description: "William Rees' personal portfolio website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${onest.className} antialiased`}
      >
        <Navbar />
        <main className="container mx-auto px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
