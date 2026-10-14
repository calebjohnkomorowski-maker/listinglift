import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-serif-display", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "ListingLift · Listing copy for real estate agents",
  description:
    "Turn property details and rough notes into MLS descriptions, social posts, email blasts, and headlines in seconds, with a built-in Fair Housing check.",
};

export const viewport: Viewport = {
  themeColor: "#24574c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
