import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Design Map — Read this before the source',
  description: 'A generated architecture map for understanding unfamiliar codebases.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
