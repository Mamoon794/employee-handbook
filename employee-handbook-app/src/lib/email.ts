import emailjs from '@emailjs/nodejs';

export const sendInvitationEmail = async ({
  email,
  invitationId,
  companyName,
}: {
  email: string;
  invitationId: string;
  companyName: string;
}) => {
  // validation
  if (!email || !email.includes('@')) {
    throw new Error('Invalid recipient email: ' + email);
  }

  try {
    const templateParams = {
      to_email: email.trim(), // rid of whitespace
      company_name: companyName,
      accept_link: `${process.env.NEXT_PUBLIC_BASE_URL}/api/accept-invitation?invitationId=${invitationId}`,
    };

    console.log('Sending to:', templateParams.to_email); // debugging

    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY!,
        privateKey: process.env.EMAILJS_PRIVATE_KEY!,
      }
    );
  } catch (error) {
    console.error('EmailJS error:', error);
    throw new Error(`Failed to send invitation to ${email}`);
  }
};