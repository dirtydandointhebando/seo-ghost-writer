import "./globals.css";
export const metadata = {
  title: "SEO Content Planner – MVP",
  description: "Audit pages, get topic ideas, and draft content.",
};

import ThemeToggle from "@/app/components/ThemeToggle";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
        <div className="container px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
