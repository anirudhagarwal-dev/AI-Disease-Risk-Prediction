interface TwilioConfig {
  accountSid: string;
  authToken: string;
}

export const sendSMS = async (to: string, message: string): Promise<boolean> => {
  const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    const response = await fetch('/api/twilio/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        message,
        accountSid,
        authToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS');
    }

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

export const sendAppointmentReminder = async (
  phoneNumber: string,
  doctorName: string,
  appointmentDate: Date
): Promise<boolean> => {
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const message = `Reminder: You have an appointment with ${doctorName} on ${formattedDate}. Stay healthy! - HealthPredict AI`;

  return sendSMS(phoneNumber, message);
};

export const sendHealthTip = async (phoneNumber: string, tip: string): Promise<boolean> => {
  const message = `Health Tip: ${tip} - HealthPredict AI`;
  return sendSMS(phoneNumber, message);
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  return phone;
};
