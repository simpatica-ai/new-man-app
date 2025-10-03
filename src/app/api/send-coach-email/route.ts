import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'

const emailSchema = z.object({
  coachEmail: z.string().email('Invalid email address'),
  practitionerName: z.string().min(1, 'Practitioner name is required').max(100, 'Name too long'),
  invitationLink: z.string().url('Invalid invitation link'),
  isExistingCoach: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('Email API called')
    
    const body = await request.json()
    
    // Server-side validation
    const validation = emailSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const { coachEmail, practitionerName, invitationLink, isExistingCoach } = validation.data
    console.log('Request data:', { coachEmail, practitionerName, invitationLink, isExistingCoach })

    const gmailUser = process.env.GMAIL_USER
    const gmailPassword = process.env.GMAIL_APP_PASSWORD
    
    console.log('Gmail user:', gmailUser)
    console.log('Gmail password exists:', !!gmailPassword)

    if (!gmailUser || !gmailPassword) {
      console.error('Missing Gmail credentials')
      return NextResponse.json(
        { error: 'Gmail credentials not configured' },
        { status: 500 }
      )
    }

    console.log('Creating transporter...')
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    })

    console.log('Sending email...')
    const mailOptions = {
      from: `"A New Man App" <new-man-app@simpatica.ai>`,
      to: coachEmail,
      subject: isExistingCoach 
        ? 'New practitioner invitation - A New Man App'
        : 'You\'ve been invited to be a coach - A New Man App',
      html: isExistingCoach ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">New Practitioner Invitation</h2>
          <p>Hello,</p>
          <p>You're receiving this email because you're already a coach on the "A New Man" virtue development platform.</p>
          <p><strong>${practitionerName}</strong> would like you to be their coach as well.</p>
          <p>As their coach, you'll guide and support their journey of personal growth and virtue development, just as you do for your other practitioners.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #d97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Accept New Practitioner
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${invitationLink}
          </p>
          <p>Thank you for your continued support in helping others grow.</p>
          <p>Best regards,<br>The A New Man Team</p>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">You've been invited to be a coach!</h2>
          <p>Hello,</p>
          <p><strong>${practitionerName}</strong> has invited you to be their coach on the "A New Man" virtue development platform.</p>
          <p>As a coach, you'll be able to guide and support their journey of personal growth and virtue development.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #d97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${invitationLink}
          </p>
          <p>Thank you for supporting someone on their journey of growth.</p>
          <p>Best regards,<br>The A New Man Team</p>
        </div>
      `
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Email error details:', error)
    return NextResponse.json(
      { error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
