import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400" });
// Title-card kanji. CJK files are large and split by unicode range, so don't preload them.
const notoSerifJp = Noto_Serif_JP({ variable: "--font-noto-serif-jp", weight: "900", preload: false });

export const metadata: Metadata = {
  title: "Fanfare: the fair fare for fans",
  description:
    "Limited drops where fans get 定価, everyone else pays one fair market price, and scalpers have nothing left to take. One verified human, one sealed bid.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${notoSerifJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
