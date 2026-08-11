import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "GBMS — Garage Billing Management System",
  description:
    "Professional billing, inventory, and customer management for tractor garages",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem("gbms-theme") || "dark";
                if (theme === "dark") document.documentElement.classList.add("dark");
                else document.documentElement.classList.add("light");
                
                var customTheme = localStorage.getItem("gbms-custom-theme");
                if (customTheme && theme === "dark") {
                  var parsed = JSON.parse(customTheme);
                  for (var key in parsed) {
                    document.documentElement.style.setProperty(key, parsed[key]);
                  }
                } else {
                  var accent = localStorage.getItem("gbms-accent");
                  if (accent) {
                    document.documentElement.style.setProperty("--primary", accent);
                    document.documentElement.style.setProperty("--ring", accent);
                    document.documentElement.style.setProperty("--sidebar-primary", accent);
                    document.documentElement.style.setProperty("--chart-1", accent);
                  }
                }
                
                var font = localStorage.getItem("gbms-font-family");
                if (font) {
                  var cssFontFamily = "var(--font-sans)";
                  if (font === "roboto") cssFontFamily = "'Roboto', sans-serif";
                  if (font === "outfit") cssFontFamily = "'Outfit', sans-serif";
                  if (font === "poppins") cssFontFamily = "'Poppins', sans-serif";
                  if (font === "josefin") cssFontFamily = "'Josefin Sans', sans-serif";
                  if (font === "rubik") cssFontFamily = "'Rubik', sans-serif";
                  if (font === "lato") cssFontFamily = "'Lato', sans-serif";
                  if (font === "ranade") cssFontFamily = "'Ranade', sans-serif";
                  if (font === "source-sans") cssFontFamily = "'Source Sans 3', sans-serif";
                  if (font === "manrope") cssFontFamily = "'Manrope', sans-serif";
                  if (font === "montserrat") cssFontFamily = "'Montserrat', sans-serif";
                  if (font === "playfair") cssFontFamily = "'Playfair Display', serif";
                  if (font === "geist") cssFontFamily = "var(--font-geist-sans), sans-serif";
                  if (font === "monospace") cssFontFamily = "var(--font-geist-mono), monospace";
                  document.documentElement.style.setProperty("--font-sans", cssFontFamily);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="bottom-left" closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
