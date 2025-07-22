import { Geist, Geist_Mono, Onest } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
