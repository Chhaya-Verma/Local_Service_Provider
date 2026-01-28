import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  userType: "customer" | "service_provider" | "admin";
  isVerified: boolean;
  avatar?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  savedAddresses?: {
    _id?: mongoose.Types.ObjectId;
    label: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }[];
  // Service provider specific fields
  businessName?: string;
  businessDescription?: string;
  services?: string[];
  experienceYears?: number;
  rating?: number;
  totalReviews?: number;
  availability?: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[\d\s-()]+$/, "Please provide a valid phone number"],
    },
    userType: {
      type: String,
      required: [true, "User type is required"],
      enum: {
        values: ["customer", "service_provider", "admin"],
        message: "User type must be customer, service_provider, or admin",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    savedAddresses: [
      {
        label: {
          type: String,
          required: true,
          trim: true,
          maxlength: [50, "Address label cannot exceed 50 characters"],
        },
        street: {
          type: String,
          required: true,
          trim: true,
        },
        city: {
          type: String,
          required: true,
          trim: true,
        },
        state: {
          type: String,
          required: true,
          trim: true,
        },
        zipCode: {
          type: String,
          required: true,
          trim: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        coordinates: {
          latitude: { type: Number },
          longitude: { type: Number },
        },
      },
    ],
    // Service Provider specific fields
    businessName: {
      type: String,
      required: function (this: IUser) {
        return this.userType === "service_provider";
      },
    },
    businessDescription: {
      type: String,
      maxlength: [500, "Business description cannot exceed 500 characters"],
    },
    services: [
      {
        type: String,
        trim: true,
      },
    ],
    experienceYears: {
      type: Number,
      min: [0, "Experience years cannot be negative"],
      max: [50, "Experience years cannot exceed 50"],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, "Total reviews cannot be negative"],
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
            match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"],
          },
          end: {
            type: String,
            match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"],
          },
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for geospatial queries
userSchema.index({ "address.coordinates": "2dsphere" });

// Index for text search
userSchema.index({ name: "text", businessName: "text", services: "text" });

// Hash password before saving
userSchema.pre("save", async function (this: IUser) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return;

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error as Error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
