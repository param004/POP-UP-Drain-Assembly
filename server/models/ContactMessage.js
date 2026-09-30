import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    subject: { type: String, default: "", trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    // Keeps the contact form usable when SMTP is not configured in development.
    delivered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
