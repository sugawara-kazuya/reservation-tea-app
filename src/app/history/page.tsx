"use client";

import { Header } from '@/components/header/Header'
import { TeaPartyGallery } from '@/components/TeaPartyGallery'
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);

export default function Home() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-24">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-gray-800 font-serif">お茶会ギャラリー</h1>
            <p className="text-xl text-center text-gray-600 mb-12 font-serif">美しいお茶会の思い出をご覧ください</p>
            <TeaPartyGallery />
          </main>
        </div>
      )}
    </Authenticator>
  )
}

