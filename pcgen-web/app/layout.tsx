import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';

export const metadata: Metadata = {
  title: 'PCGen Web - Pathfinder Character Builder',
  description:
    'Modern web-based character builder for Pathfinder 1E and 2E. Create, manage, and export your characters.',
  keywords: ['pathfinder', 'character builder', 'rpg', 'pcgen', 'tabletop'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
