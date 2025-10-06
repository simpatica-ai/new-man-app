import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    console.log('Custom password reset email API called')
    
    const body = await request.json()
    
    // Server-side validation
    const validation = passwordResetSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const { email } = validation.data
    console.log('Password reset request for:', email)

    // Create admin Supabase client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user exists (for security, we still send success message regardless)
    console.log('Checking if user exists...')
    const { data: userExists, error: userCheckError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    console.log('User exists check result:', { userExists: !!userExists, error: userCheckError?.message })

    // If user exists, send our custom email
    if (userExists) {
      console.log('User exists, proceeding with email sending...')
      const gmailUser = process.env.GMAIL_USER
      const gmailPassword = process.env.GMAIL_APP_PASSWORD
      
      if (!gmailUser || !gmailPassword) {
        console.error('Missing Gmail credentials')
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        )
      }

      console.log('Gmail credentials found, creating transporter...')
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword
        }
      })

      console.log('Sending custom password reset email to:', email)
      const mailOptions = {
        from: `"A New Man App" <new-man-app@simpatica.ai>`,
        to: email,
        subject: 'Reset your password - A New Man App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #d97706; font-size: 28px; margin: 0; font-weight: bold;">A New Man</h1>
              <p style="color: #666666; font-size: 14px; margin: 5px 0 0 0;">Virtue Development Platform</p>
            </div>

            <!-- Main Content -->
            <div style="background-color: #fefefe; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
              <h2 style="color: #d97706; font-size: 24px; margin: 0 0 20px 0;">Reset Your Password</h2>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">Hello,</p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">
                You requested to reset your password for your A New Man App account.
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">
                You should receive a separate email with a secure reset link shortly. Click the "Reset Password" button in that email to create your new password.
              </p>

              <!-- Security Notice -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0; font-weight: bold;">🔒 Security Notice</p>
                <p style="color: #856404; font-size: 14px; margin: 5px 0 0 0; line-height: 1.4;">
                  The reset link will expire in 1 hour for your security. If you didn't request this password reset, you can safely ignore this email.
                </p>
              </div>

              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 20px 0 0 0;">
                Best regards,<br>
                <strong>The A New Man Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
              <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.4;">
                This email was sent to ${email}. If you have any questions, please contact our support team.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                © 2024 A New Man App. All rights reserved.
              </p>
            </div>
          </div>
        `
      }

      try {
        const result = await transporter.sendMail(mailOptions)
        console.log('Custom password reset email sent successfully:', result.messageId)
      } catch (emailError) {
        console.error('Custom email failed, but Supabase email should still work:', emailError)
        // Don't fail the request - Supabase email might still work
      }
    }

    // Always return success for security (prevents email enumeration)
    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists with this email, you will receive password reset instructions shortly.' 
    })

  } catch (error) {
    console.error('Password reset error:', error)
    // Always return success for security
    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists with this email, you will receive password reset instructions shortly.' 
    })
  }
}