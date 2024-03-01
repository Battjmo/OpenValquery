import "./globals.css";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
import Header from "./components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Valquery",
  description:
    "The low-touch, AI powered data catalog. (Re)discover your most valuable data, without documentation",
  metadataBase: new URL("https://valquery.ai"),
  openGraph: {
    type: "website",
    url: "https://valquery.com",
    title: "Valquery",
    description:
      "The low-touch, AI powered data catalog. (Re)discover your most valuable data, without documentation",
    images: [
      {
        url: "https://www.valquery.ai/spear_logo.svg",
        width: 1200,
        height: 630,
        alt: "Valquery",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
