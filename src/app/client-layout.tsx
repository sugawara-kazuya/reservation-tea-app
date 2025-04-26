'use client'

import { Authenticator, translations } from '@aws-amplify/ui-react'
import { I18n } from 'aws-amplify'
import '@aws-amplify/ui-react/styles.css'
import React from 'react'

I18n.putVocabularies(translations)
I18n.setLanguage('ja')

type Props = {
  children: React.ReactNode
}

export default function ClientLayout({ children }: Props) {
  return (
    <Authenticator.Provider>
      {children}
    </Authenticator.Provider>
  )
}
