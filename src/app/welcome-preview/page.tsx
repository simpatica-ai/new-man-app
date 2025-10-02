'use client'

import { Button } from "@/components/ui/button"
import AppHeader from "@/components/AppHeader"

export default function WelcomePreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <AppHeader />
      
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your Virtue Development Journey
            </h1>
            <p className="text-sm text-gray-500">(Preview Mode)</p>
          </div>

          {/* Introduction Text */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Welcome to a transformative journey of virtue development. This program is designed to guide you through 
              a comprehensive process of personal growth, helping you identify, understand, and cultivate the virtues 
              that will shape your character and enhance your life.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our approach follows a proven methodology that takes you through four distinct stages of virtue recovery 
              and development. Each stage builds upon the previous one, creating a solid foundation for lasting change 
              and personal transformation.
            </p>
          </div>

          {/* Process Flow Image */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              The Four Stages of Virtue Development
            </h2>
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-3xl bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">Process Flow Image</p>
                <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                  <div className="bg-blue-100 px-4 py-2 rounded-lg">Discovery</div>
                  <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                  <div className="bg-orange-100 px-4 py-2 rounded-lg">Dismantling</div>
                  <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                  <div className="bg-green-100 px-4 py-2 rounded-lg">Building</div>
                  <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                  <div className="bg-purple-100 px-4 py-2 rounded-lg">Wisdom</div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Place your process flow image at: /public/virtue-process-flow.png
                </p>
              </div>
            </div>
          </div>

          {/* Stage Descriptions */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-blue-600 mb-3">Discovery</h3>
                <p className="text-gray-700 mb-4">
                  Begin with a comprehensive assessment to understand your current virtue landscape. 
                  Identify strengths, areas for growth, and the specific virtues that will have the 
                  greatest impact on your personal development.
                </p>

                <h3 className="text-xl font-semibold text-orange-600 mb-3">Dismantling</h3>
                <p className="text-gray-700 mb-4">
                  Carefully examine and address the barriers, habits, and thought patterns that 
                  prevent virtue development. This stage involves honest self-reflection and the 
                  courage to let go of what no longer serves you.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-600 mb-3">Building</h3>
                <p className="text-gray-700 mb-4">
                  Actively cultivate new virtuous habits and practices. Through consistent effort 
                  and intentional action, you&apos;ll develop the character traits that align with your 
                  values and aspirations.
                </p>

                <h3 className="text-xl font-semibold text-purple-600 mb-3">Wisdom</h3>
                <p className="text-gray-700">
                  Integrate your developed virtues into daily life with wisdom and discernment. 
                  Learn to apply virtue contextually and help others on their own journey of 
                  character development.
                </p>
              </div>
            </div>
          </div>

          {/* Virtue Rose Section */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  The Virtue Rose
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Like a rose that blooms through careful tending, virtue development requires patience, 
                  nurturing, and consistent care. Each petal represents a different aspect of character 
                  that, when cultivated together, creates something beautiful and meaningful. Your journey 
                  will help you tend to your own virtue garden, allowing your character to flourish and 
                  inspire others.
                </p>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="w-64 h-64 bg-rose-100 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌹</div>
                    <p className="text-sm text-gray-600">Virtue Rose Image</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Place at: /public/virtue-rose.png
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled
            >
              Begin Your Assessment (Preview Mode)
            </Button>
            <p className="text-gray-600 mt-4">
              Take the first step in your virtue development journey
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
