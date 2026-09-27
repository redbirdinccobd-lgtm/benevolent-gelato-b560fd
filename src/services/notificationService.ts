export const sendNotification = async (subject: string, html: string, to?: string) => {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject, html, to }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Notification Service Error:', error);
    // We don't want to break the app if notifications fail
    return null;
  }
};

export const notifyNewShipment = async (shipmentId: string, buyerName: string) => {
  const subject = `🚀 New Shipment Created: ${shipmentId}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ef4444;">New Shipment Notification</h2>
      <p>A new shipment has been created and requires verification.</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Shipment ID:</strong> ${shipmentId}</p>
        <p><strong>Buyer:</strong> ${buyerName}</p>
      </div>
      <p>Please log in to the Admin Portal to review and verify this shipment.</p>
      <a href="${window.location.origin}" style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
    </div>
  `;
  return sendNotification(subject, html);
};

export const notifyVerificationRequired = async (shipmentId: string) => {
  const subject = `⚠️ Verification Required: ${shipmentId}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ef4444;">Verification Needed</h2>
      <p>Shipment <strong>${shipmentId}</strong> has been flagged or requires immediate verification by the Master Admin.</p>
      <p>This action was triggered by a user search or manual status update.</p>
      <a href="${window.location.origin}" style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Now</a>
    </div>
  `;
  return sendNotification(subject, html);
};
