import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  serviceProviderId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  serviceProvider: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
  };
  service: {
    title: string;
    category: string;
    price: {
      amount: number;
      type: string;
      currency: string;
    };
  };
  bookingDate: Date;
  timeSlot: {
    start: string;
    end: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notes?: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod?: string;
  rating?: number;
  review?: string;
  reviewDate?: Date;
  cancellationReason?: string;
  cancelledBy?: "customer" | "service_provider";
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },
    serviceProviderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Service Provider ID is required"],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service ID is required"],
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    serviceProvider: {
      name: { type: String, required: true },
      businessName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    service: {
      title: { type: String, required: true },
      category: { type: String, required: true },
      price: {
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        currency: { type: String, required: true },
      },
    },
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    timeSlot: {
      start: {
        type: String,
        required: [true, "Start time is required"],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"],
      },
      end: {
        type: String,
        required: [true, "End time is required"],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"],
      },
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },
    review: {
      type: String,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
    },
    reviewDate: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },
    cancelledBy: {
      type: String,
      enum: ["customer", "service_provider"],
    },
    cancelledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ serviceProviderId: 1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for booking duration in hours
bookingSchema.virtual('durationHours').get(function() {
  const startTime = this.timeSlot.start.split(':');
  const endTime = this.timeSlot.end.split(':');
  
  const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
  const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
  
  return Math.max(0, (endMinutes - startMinutes) / 60);
});

// Pre-save middleware to set completion date
bookingSchema.pre('save', function(this: IBooking) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  
  if (this.isModified('rating') && this.rating && !this.reviewDate) {
    this.reviewDate = new Date();
  }
});

const Booking = mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
