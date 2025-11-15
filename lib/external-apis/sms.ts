import twilio from 'twilio'

export async function sendSMSAlert(phoneNumber: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER
  
  if (!accountSid || !authToken || !twilioPhone) {
    console.warn('Twilio not configured')
    return false
  }
  
  try {
    const client = twilio(accountSid, authToken)
    
    await client.messages.create({
      body: message,
      from: twilioPhone,
      to: phoneNumber
    })
    
    return true
  } catch (error) {
    console.error('Error sending SMS:', error)
    return false
  }
}

