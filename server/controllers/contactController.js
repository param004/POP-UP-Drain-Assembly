import { ContactMessage } from "../models/ContactMessage.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Sends the enquiry over SMTP when configured, otherwise logs it.
 * A mail failure never blocks the submission — the message is already stored.
 */
async function deliver(message) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  if (!SMTP_HOST || !CONTACT_TO) {
    console.log(`[contact] (no SMTP configured) ${message.email} — "${message.message.slice(0, 80)}"`);
    return false;
  }

  // Imported lazily so the server boots without SMTP configured.
  const { createTransport } = await import("nodemailer");
  const transport = createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  await transport.sendMail({
    from: `"Premier Products® Website" <${SMTP_USER || CONTACT_TO}>`,
    to: CONTACT_TO,
    replyTo: `${message.name} <${message.email}>`,
    subject: message.subject || `New enquiry from ${message.name}`,
    text: `${message.name} (${message.email}) wrote:\n\n${message.message}`,
  });

  return true;
}

/** POST /api/contact */
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email and message are all required." });
  }

  const doc = await ContactMessage.create({ name, email, subject, message });

  try {
    doc.delivered = await deliver(doc);
    await doc.save();
  } catch (err) {
    console.error("[contact] delivery failed:", err.message);
  }

  return res.status(201).json({
    message: "Thanks — your message is in. We reply to most enquiries within one business day.",
    id: doc._id,
  });
});

/** GET /api/contact (admin) */
export const listContactMessages = asyncHandler(async (req, res) => {
  const items = await ContactMessage.find().sort({ createdAt: -1 }).limit(100);
  res.json({ items });
});
