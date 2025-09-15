import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email, confirmationUrl } = await request.json()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    await transporter.sendMail({
      from: `"A New Man App" <new-man-app@simpatica.ai>`,
      to: email,
      subject: 'Confirm your email - A New Man App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Welcome to A New Man!</h2>
          <p>Hello,</p>
          <p>Thank you for signing up for the "A New Man" virtue development platform.</p>
          <p>To complete your registration and start your journey of personal growth, please confirm your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #d97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Confirm Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy this link:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${confirmationUrl}
          </p>
          <p>Welcome to your journey of virtue development!</p>
          <p>Best regards,<br>The A New Man Team</p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
