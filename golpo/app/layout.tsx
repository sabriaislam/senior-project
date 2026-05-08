import type { Metadata } from "next";
import localFont from "next/font/local";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";

const blur = localFont({
  src: "../public/fonts/Blur.ttf",
  variable: "--font-blur",
});

const karla = localFont({
  src: "../public/fonts/Karla-Regular-S52ZIU5L.3ac28a6ac03a9f7f3d82.woff",
  variable: "--font-karla",
});

const pixel = localFont({
  src: "../public/fonts/PFPixelscriptPro.ttf",
  variable: "--font-pixel",
});

const gayatri = localFont({
  src: [
    { path: "../public/fonts/gayatrial-regular.otf", style: "normal" },
    { path: "../public/fonts/gayatrial-italic.otf", style: "italic" },
  ],
  variable: "--font-gayatri",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Golpo Project",
  description: "Golpo Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased ${blur.variable} ${karla.variable} ${pixel.variable} ${gayatri.variable} ${robotoMono.variable}`}
      >
        {children}
        <DeploymentCheck />
      </body>
    </html>
  );
}

function DeploymentCheck() {
  // Injected at build time by Next.js — undefined in dev, a hash string in prod
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  var BUILD_ID = ${JSON.stringify(buildId)};
  var stored = sessionStorage.getItem('__build_id');
  if (stored && stored !== BUILD_ID) {
    sessionStorage.setItem('__build_id', BUILD_ID);
    window.location.reload();
  } else {
    sessionStorage.setItem('__build_id', BUILD_ID);
  }
})();
        `.trim(),
      }}
    />
  );
}
