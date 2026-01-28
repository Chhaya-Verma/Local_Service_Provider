'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  FileText,
  MapPin,
  Building,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { providerApplicationAPI, ProviderApplication } from '../../../src/lib/api';

// Validation schema
const applicationSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessDescription: z.string().min(10, 'Description must be at least 10 characters'),
  services: z.array(z.string()).min(1, 'Please select at least one service'),
  experienceYears: z.number().min(0, 'Experience cannot be negative').max(50, 'Experience cannot exceed 50 years'),
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'Valid ZIP code is required'),
  }),
  documents: z.object({
    idProof: z.object({
      type: z.enum(['passport', 'driving_license', 'national_id', 'aadhar']),
      number: z.string().min(5, 'ID number is required'),
      imageUrl: z.string().url('Valid image URL is required'),
    }),
    certificates: z.array(z.object({
      name: z.string().min(2, 'Certificate name is required'),
      imageUrl: z.string().url('Valid image URL is required'),
      issuer: z.string().min(2, 'Issuer is required'),
      issueDate: z.string(),
    })).min(1, 'At least one certificate is required'),
    businessLicense: z.object({
      number: z.string().optional(),
      imageUrl: z.string().url('Valid image URL is required').optional(),
      issueDate: z.string().optional(),
      expiryDate: z.string().optional(),
    }).optional(),
  }),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const availableServices = [
  'Cleaning', 'Plumbing', 'Electrical', 'Carpentry', 'Painting', 
  'Gardening', 'Moving', 'Tutoring', 'Pet Care', 'Home Repair',
  'Beauty & Wellness', 'Photography', 'Event Planning', 'IT Support', 'Other'
];

const idTypes = [
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'national_id', label: 'National ID' },
  { value: 'aadhar', label: 'Aadhar Card' }
];

const ProviderApplicationPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [existingApplication, setExistingApplication] = useState<ProviderApplication | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      services: [],
      documents: {
        certificates: [{ name: '', imageUrl: '', issuer: '', issueDate: '' }],
      },
    }
  });

  const watchedServices = watch('services') || [];
  const watchedCertificates = watch('documents.certificates') || [];

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.userType !== 'service_provider') {
      router.push('/dashboard');
      return;
    }

    // Check for existing application
    loadExistingApplication();
  }, [user, loading, router]);

  const loadExistingApplication = async () => {
    try {
      const response = await providerApplicationAPI.getMyApplication();
      const app = response.data;
      setExistingApplication(app);
      
      if (app.status === 'approved') {
        router.push('/provider/dashboard');
        return;
      }
      
      // Populate form with existing data if it's a rejected application
      if (app.status === 'rejected') {
        reset({
          businessName: app.businessName,
          businessDescription: app.businessDescription,
          services: app.services,
          experienceYears: app.experienceYears,
          address: app.address,
          documents: app.documents
        });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading application:', error);
      }
    }
  };

  const handleServiceToggle = (service: string) => {
    const currentServices = watchedServices;
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    setValue('services', updatedServices);
  };

  const addCertificate = () => {
    const current = watchedCertificates;
    setValue('documents.certificates', [
      ...current,
      { name: '', imageUrl: '', issuer: '', issueDate: '' }
    ]);
  };

  const removeCertificate = (index: number) => {
    const current = watchedCertificates;
    setValue('documents.certificates', current.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, documentType: string): Promise<string> => {
    try {
      const response = await providerApplicationAPI.uploadDocument(documentType, file);
      return response.data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload file');
    }
  };

  const handleFileUpload = async (
    file: File, 
    field: string, 
    index?: number
  ) => {
    try {
      const url = await uploadFile(file, field);
      
      if (field === 'idProof') {
        setValue('documents.idProof.imageUrl', url);
      } else if (field === 'certificate' && index !== undefined) {
        const certificates = watchedCertificates;
        certificates[index].imageUrl = url;
        setValue('documents.certificates', certificates);
      } else if (field === 'businessLicense') {
        setValue('documents.businessLicense.imageUrl', url);
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Normalize businessLicense to match backend expectations:
      // if businessLicense exists ensure required fields are strings (no undefined)
      const businessLicense = data.documents.businessLicense;
      const normalizedBusinessLicense = businessLicense
        ? {
            number: businessLicense.number ?? '',
            imageUrl: businessLicense.imageUrl ?? '',
            issueDate: businessLicense.issueDate ?? '',
            expiryDate: businessLicense.expiryDate ?? undefined,
          }
        : undefined;

      const payload = {
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        services: data.services,
        experienceYears: data.experienceYears,
        address: data.address,
        documents: {
          ...data.documents,
          businessLicense: normalizedBusinessLicense,
        },
      };

      if (existingApplication) {
        await providerApplicationAPI.updateApplication(payload);
      } else {
        await providerApplicationAPI.submitApplication(payload);
      }
      
      router.push('/provider/dashboard');
    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (existingApplication?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Under Review</h1>
            <p className="text-gray-600 mb-6">
              Your provider application has been submitted and is currently under review. 
              We'll notify you once it has been processed.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Submitted:</strong> {new Date(existingApplication.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => router.push('/provider/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {existingApplication?.status === 'rejected' ? 'Resubmit' : 'Submit'} Provider Application
            </h1>
            <p className="text-gray-600 mt-2">
              Complete this application to start offering services on our platform.
            </p>
            
            {existingApplication?.status === 'rejected' && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Application Rejected</h3>
                    <p className="mt-1 text-sm text-red-700">{existingApplication.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Business Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Business Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    {...register('businessName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your business name"
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Description *
                  </label>
                  <textarea
                    {...register('businessDescription')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your business and expertise..."
                  />
                  {errors.businessDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessDescription.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience *
                  </label>
                  <input
                    {...register('experienceYears', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  {errors.experienceYears && (
                    <p className="mt-1 text-sm text-red-600">{errors.experienceYears.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Services You Offer *
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableServices.map((service) => (
                  <label
                    key={service}
                    className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                      watchedServices.includes(service)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={watchedServices.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{service}</span>
                  </label>
                ))}
              </div>
              {errors.services && (
                <p className="mt-1 text-sm text-red-600">{errors.services.message}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Business Address
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    {...register('address.street')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Main Street"
                  />
                  {errors.address?.street && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    {...register('address.city')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City"
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    {...register('address.state')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="State"
                  />
                  {errors.address?.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    {...register('address.zipCode')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="12345"
                  />
                  {errors.address?.zipCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.zipCode.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Required Documents
              </h2>
              
              {/* ID Proof */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">ID Proof *</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Type *
                    </label>
                    <select
                      {...register('documents.idProof.type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select ID Type</option>
                      {idTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.documents?.idProof?.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.documents.idProof.type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Number *
                    </label>
                    <input
                      {...register('documents.idProof.number')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter ID number"
                    />
                    {errors.documents?.idProof?.number && (
                      <p className="mt-1 text-sm text-red-600">{errors.documents.idProof.number.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Document Image *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload ID document image</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'idProof');
                        }}
                        className="w-full"
                      />
                    </div>
                    <input
                      {...register('documents.idProof.imageUrl')}
                      type="hidden"
                    />
                    {errors.documents?.idProof?.imageUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.documents.idProof.imageUrl.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Certificates */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-gray-900">Professional Certificates *</h3>
                  <button
                    type="button"
                    onClick={addCertificate}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Certificate
                  </button>
                </div>
                
                {watchedCertificates.map((_, index) => (
                  <div key={index} className="bg-white rounded-md p-4 mb-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Certificate #{index + 1}</h4>
                      {watchedCertificates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCertificate(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certificate Name *
                        </label>
                        <input
                          {...register(`documents.certificates.${index}.name`)}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Plumbing Certification"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issuer *
                        </label>
                        <input
                          {...register(`documents.certificates.${index}.issuer`)}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Issuing organization"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issue Date *
                        </label>
                        <input
                          {...register(`documents.certificates.${index}.issueDate`)}
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certificate Image *
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'certificate', index);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          {...register(`documents.certificates.${index}.imageUrl`)}
                          type="hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProviderApplicationPage;
