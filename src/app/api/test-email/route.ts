import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing email configuration...')
    
    const gmailUser = process.env.GMAIL_USER
    const gmailPassword = process.env.GMAIL_APP_PASSWORD
    
    console.log('Gmail user:', gmailUser)
    console.log('Gmail password exists:', !!gmailPassword)
    
    if (!gmailUser || !gmailPassword) {
      return NextResponse.json({
        error: 'Gmail credentials not configured',
        gmailUser: !!gmailUser,
        gmailPassword: !!gmailPassword
      }, { status: 500 })
    }

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    })

    // Test email
    const result = await transporter.sendMail({
      from: `"A New Man App Test" <new-man-app@simpatica.ai>`,
      to: gmailUser, // Send to yourself
      subject: 'Email Configuration Test',
      html: '<h1>Email Test Successful!</h1><p>Your email configuration is working.</p>'
    })

    console.log('Test email sent successfully:', result.messageId)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Test email sent successfully'
    })

  } catch (error) {
    console.error('Email test failed:', error)
    return NextResponse.json({
      error: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}