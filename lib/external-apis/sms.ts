// SMS functionality disabled for now
// TODO: Implement SMS alerts in future version

export async function sendSMSAlert(phoneNumber: string, message: string): Promise<boolean> {
  console.log('SMS alerts not configured. Message would be sent to:', phoneNumber)
  console.log('Message:', message)

  // Return true to not break existing code that calls this function
  return true
}
