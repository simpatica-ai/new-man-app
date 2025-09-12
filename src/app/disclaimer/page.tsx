'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Footer from '@/components/Footer'

export default function DisclaimerPage() {
  useEffect(() => {
    document.title = "New Man App: Disclaimer";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-stone-800">
              Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-stone max-w-none space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">Not Medical or Mental Health Treatment</h2>
              <p className="text-stone-700">
                The New Man App is designed for personal development, character building, and virtue cultivation. 
                It is <strong>not intended to provide medical advice, mental health treatment, or therapy</strong>. 
                The content and features of this application should not be used as a substitute for professional 
                medical care, psychiatric treatment, or counseling.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">Educational and Inspirational Purpose</h2>
              <p className="text-stone-700">
                This application provides educational content, self-reflection tools, and inspirational guidance 
                for personal growth. Any insights, reports, or recommendations generated are for informational 
                and motivational purposes only and should not be considered professional advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">Seek Professional Help When Needed</h2>
              <p className="text-stone-700">
                If you are experiencing mental health concerns, substance abuse issues, or other serious personal 
                challenges, please consult with qualified healthcare professionals, licensed therapists, or 
                appropriate support services. This app is not a replacement for professional treatment or 
                emergency services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">Privacy and Data Use</h2>
              <p className="text-stone-700">
                While we implement security measures to protect your personal information, this application 
                is not HIPAA-compliant and should not be used to store protected health information (PHI). 
                Your journal entries and personal reflections are stored securely but are intended for 
                personal development purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">Sponsor Relationships</h2>
              <p className="text-stone-700">
                The sponsor/mentorship feature connects users for mutual support and encouragement in personal 
                growth. Sponsors are not professional counselors or therapists. These relationships are peer-to-peer 
                support connections and should not replace professional guidance when needed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">Use at Your Own Discretion</h2>
              <p className="text-stone-700">
                By using this application, you acknowledge that you are using it for personal development and 
                character building purposes. You understand that any decisions you make based on the content 
                or insights provided are your own responsibility.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">Emergency Resources</h2>
              <p className="text-stone-700">
                If you are in crisis or having thoughts of self-harm, please contact emergency services 
                immediately or call:
              </p>
              <ul className="list-disc list-inside text-stone-700 ml-4">
                <li>National Suicide Prevention Lifeline: 988</li>
                <li>Crisis Text Line: Text HOME to 741741</li>
                <li>Emergency Services: 911</li>
              </ul>
            </section>

            <div className="border-t border-stone-200 pt-6 mt-8">
              <p className="text-sm text-stone-600 text-center">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
