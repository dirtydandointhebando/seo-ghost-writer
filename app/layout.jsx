import "./globals.css";
export const metadata = {
  title: "SEO Content Planner – MVP",
  description: "Audit pages, get topic ideas, and draft content.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="container px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
