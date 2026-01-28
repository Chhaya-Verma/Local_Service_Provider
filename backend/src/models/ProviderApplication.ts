import mongoose, { Document, Schema } from "mongoose";

export interface IProviderApplication extends Document {
  userId: mongoose.Types.ObjectId;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  businessName: string;
  businessDescription: string;
  services: string[];
  experienceYears: number;
  documents: {
    idProof: {
      type: string; // "passport" | "driving_license" | "national_id"
      number: string;
      imageUrl: string;
    };
    certificates: {
      name: string;
      imageUrl: string;
      issuer: string;
      issueDate: Date;
    }[];
    businessLicense?: {
      number: string;
      imageUrl: string;
      issueDate: Date;
      expiryDate?: Date;
    };
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
  status: "pending" | "approved" | "rejected" | "under_review";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const providerApplicationSchema = new Schema<IProviderApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
    user: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: [100, "Business name cannot exceed 100 characters"],
    },
    businessDescription: {
      type: String,
      required: [true, "Business description is required"],
      trim: true,
      maxlength: [1000, "Business description cannot exceed 1000 characters"],
    },
    services: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    experienceYears: {
      type: Number,
      required: [true, "Experience years is required"],
      min: [0, "Experience years cannot be negative"],
      max: [50, "Experience years cannot exceed 50"],
    },
    documents: {
      idProof: {
        type: {
          type: String,
          required: true,
          enum: ["passport", "driving_license", "national_id", "aadhar"],
        },
        number: {
          type: String,
          required: true,
          trim: true,
        },
        imageUrl: {
          type: String,
          required: true,
        },
      },
      certificates: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          imageUrl: {
            type: String,
            required: true,
          },
          issuer: {
            type: String,
            required: true,
            trim: true,
          },
          issueDate: {
            type: Date,
            required: true,
          },
        },
      ],
      businessLicense: {
        number: {
          type: String,
          trim: true,
        },
        imageUrl: {
          type: String,
        },
        issueDate: {
          type: Date,
        },
        expiryDate: {
          type: Date,
        },
      },
    },
    address: {
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
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "under_review"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Review notes cannot exceed 500 characters"],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
providerApplicationSchema.index({ userId: 1 });
providerApplicationSchema.index({ status: 1 });
providerApplicationSchema.index({ createdAt: -1 });
providerApplicationSchema.index({ "address.city": 1, "address.state": 1 });

// Pre-save middleware
providerApplicationSchema.pre('save', function(this: IProviderApplication) {
  if (this.isModified('status') && this.status !== 'pending' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
});

const ProviderApplication = mongoose.model<IProviderApplication>("ProviderApplication", providerApplicationSchema);

export default ProviderApplication;
