import "./globals.css";

export const metadata = {
  title: "Next MUI Auth",
  description: "Auth demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}