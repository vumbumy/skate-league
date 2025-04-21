'use client';

import {Inter} from 'next/font/google';
import './globals.css';
import React from 'react';
import GNB from "@/components/GNB";

const inter = Inter({subsets: ['latin']});

export default function RootLayout({children}: { children: React.ReactNode }) {
  // Render html/body once with the determined layout
  return (
    <html lang="en">
    <body className={inter.className}>
    <div className='h-screen flex flex-col items-center mx-auto' style={{maxWidth: '600px'}}>
      <GNB/>
      <div className='flex flex-col items-center justify-center h-full bg-gray-100 w-full'>
        {children}
      </div>
    </div>
    </body>
    </html>
  );
}
