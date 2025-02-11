"use client";

import { Header } from '@/components/header/Header'
import { TeaPartyDetail } from '@/components/TeaPartyDetail'
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);

export default function EventDetail({ params }: { params: { id: string } }) {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-24">
            <TeaPartyDetail eventId={params.id} />
          </main>
        </div>
      )}
    </Authenticator>
  )
}

