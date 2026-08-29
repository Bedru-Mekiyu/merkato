import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Merkato",
    template: "%s · Merkato",
  },
  description: "The all-in-one operating system for your startup.",
};

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('merkato_theme_preference');
      var valid = ['moodle-cobalt', 'cyber-indigo', 'emerald-matrix', 'sunset-crimson', 'nordic-frost'];
      var theme = (saved && valid.indexOf(saved) !== -1) ? saved : 'moodle-cobalt';
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.className = 'dark';
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'moodle-cobalt');
      document.documentElement.className = 'dark';
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="moodle-cobalt" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
