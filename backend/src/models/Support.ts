import mongoose, { Document, Schema } from "mongoose";

export interface ISupport extends Document {
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  user: {
    name: string;
    email: string;
    phone: string;
    userType: string;
  };
  type: "complaint" | "support" | "feedback" | "refund_request" | "technical_issue";
  priority: "low" | "medium" | "high" | "urgent";
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  attachments?: string[];
  messages: {
    sender: mongoose.Types.ObjectId;
    senderName: string;
    senderType: "user" | "admin" | "system";
    message: string;
    timestamp: Date;
    isInternal?: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const supportSchema = new Schema<ISupport>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    user: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      userType: { type: String, required: true },
    },
    type: {
      type: String,
      required: [true, "Support type is required"],
      enum: ["complaint", "support", "feedback", "refund_request", "technical_issue"],
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      required: true,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [1000, "Resolution cannot exceed 1000 characters"],
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    attachments: [
      {
        type: String,
        validate: {
          validator: function (url: string) {
            return /^(https?:\/\/)/.test(url) || url.startsWith('/uploads/');
          },
          message: "Invalid attachment URL",
        },
      },
    ],
    messages: [
      {
        sender: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        senderName: {
          type: String,
          required: true,
        },
        senderType: {
          type: String,
          required: true,
          enum: ["user", "admin", "system"],
        },
        message: {
          type: String,
          required: true,
          trim: true,
          maxlength: [1000, "Message cannot exceed 1000 characters"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        isInternal: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
supportSchema.index({ userId: 1 });
supportSchema.index({ bookingId: 1 });
supportSchema.index({ status: 1 });
supportSchema.index({ type: 1 });
supportSchema.index({ priority: 1 });
supportSchema.index({ createdAt: -1 });
supportSchema.index({ ticketId: 1 });

// Auto-generate ticket ID
supportSchema.pre('save', async function(this: ISupport) {
  if (this.isNew && !this.ticketId) {
    const count = await mongoose.model('Support').countDocuments();
    this.ticketId = `TK${Date.now()}${(count + 1).toString().padStart(3, '0')}`;
  }
  
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
});

const Support = mongoose.model<ISupport>("Support", supportSchema);

export default Support;
