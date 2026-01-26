import mongoose, { Document, Schema } from "mongoose";

export interface IService extends Document {
  title: string;
  description: string;
  category: string;
  price: {
    amount: number;
    type: "fixed" | "hourly" | "negotiable";
    currency: string;
  };
  serviceProviderId: mongoose.Types.ObjectId;
  serviceProvider: {
    name: string;
    businessName: string;
    rating: number;
    totalReviews: number;
    avatar?: string;
  };
  location: {
    city: string;
    state: string;
    zipCode?: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
  images: string[];
  tags: string[];
  duration?: {
    estimated: number; // in minutes
    unit: "minutes" | "hours" | "days";
  };
  requirements?: string[];
  isActive: boolean;
  rating: number;
  totalBookings: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Service category is required"],
      enum: [
        "Cleaning",
        "Plumbing",
        "Electrical",
        "Carpentry",
        "Painting",
        "Gardening",
        "Moving",
        "Tutoring",
        "Pet Care",
        "Home Repair",
        "Beauty & Wellness",
        "Photography",
        "Event Planning",
        "IT Support",
        "Other",
      ],
    },
    price: {
      amount: {
        type: Number,
        required: [true, "Price amount is required"],
        min: [0, "Price cannot be negative"],
      },
      type: {
        type: String,
        required: [true, "Price type is required"],
        enum: ["fixed", "hourly", "negotiable"],
        default: "fixed",
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "INR"],
      },
    },
    serviceProviderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Service provider ID is required"],
    },
    serviceProvider: {
      name: {
        type: String,
        required: true,
      },
      businessName: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalReviews: {
        type: Number,
        default: 0,
        min: 0,
      },
      avatar: {
        type: String,
        default: "",
      },
    },
    location: {
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          min: [-90, "Latitude must be between -90 and 90"],
          max: [90, "Latitude must be between -90 and 90"],
        },
        longitude: {
          type: Number,
          min: [-180, "Longitude must be between -180 and 180"],
          max: [180, "Longitude must be between -180 and 180"],
        },
      },
    },
    availability: {
      days: [
        {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
      ],
      timeSlots: [
        {
          start: {
            type: String,
            required: true,
            match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"],
          },
          end: {
            type: String,
            required: true,
            match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"],
          },
        },
      ],
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (url: string) {
            return /^(https?:\/\/)/.test(url) || url.startsWith('/uploads/');
          },
          message: "Invalid image URL",
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    duration: {
      estimated: {
        type: Number,
        min: [1, "Duration must be at least 1"],
      },
      unit: {
        type: String,
        enum: ["minutes", "hours", "days"],
        default: "hours",
      },
    },
    requirements: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Requirement cannot exceed 200 characters"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: [0, "Total bookings cannot be negative"],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, "Total reviews cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
serviceSchema.index({ category: 1 });
serviceSchema.index({ "location.city": 1, "location.state": 1 });
serviceSchema.index({ serviceProviderId: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ rating: -1 });
serviceSchema.index({ createdAt: -1 });
serviceSchema.index({ "location.coordinates": "2dsphere" }); // For geospatial queries
serviceSchema.index({ title: "text", description: "text", tags: "text" }); // For text search

// Virtual for average rating calculation
serviceSchema.virtual('averageRating').get(function() {
  return this.totalReviews > 0 ? this.rating : 0;
});

// Virtual for formatted price
serviceSchema.virtual('formattedPrice').get(function() {
  const { amount, type, currency } = this.price;
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
  
  if (type === 'negotiable') {
    return 'Negotiable';
  }
  
  return `${symbol}${amount}${type === 'hourly' ? '/hr' : ''}`;
});

// Pre-save middleware to update service provider info
serviceSchema.pre('save', async function(this: IService) {
  if (this.isNew || this.isModified('serviceProviderId')) {
    try {
      const User = mongoose.model('User');
      const provider = await User.findById(this.serviceProviderId);
      
      if (provider) {
        this.serviceProvider = {
          name: provider.name,
          businessName: provider.businessName || provider.name,
          rating: provider.rating || 0,
          totalReviews: provider.totalReviews || 0,
          avatar: provider.avatar || '',
        };
      }
    } catch (error) {
      console.error('Error updating service provider info:', error);
    }
  }
});

const Service = mongoose.model<IService>("Service", serviceSchema);

export default Service;
