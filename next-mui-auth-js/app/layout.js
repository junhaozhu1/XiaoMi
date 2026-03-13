// app/layout.js
import "./globals.css";
import MuiProvider from "@/components/MuiProvider";

export const metadata = {
  title: "Next MUI Auth",
  description: "Auth demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}