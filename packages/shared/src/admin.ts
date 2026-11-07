import { z } from "zod";
import type { BusinessStatus, BusinessType, Role } from "./constants";
import type { VerificationStatus } from "./api-types";

// Types and schemas for the admin API (/api/v1/admin/*). Owner: Kalindu.

export const BUSINESS_STATUS_FILTERS = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "ALL"] as const;
export type BusinessStatusFilter = (typeof BUSINESS_STATUS_FILTERS)[number];

// POST /admin/businesses/:id/reject  (a reason is required so the business knows why)
export const rejectBusinessSchema = z.object({
  remarks: z.string().trim().min(3, "Write a reason for the business").max(500),
});
export type RejectBusinessInput = z.infer<typeof rejectBusinessSchema>;

// GET /admin/businesses
export type AdminBusinessDto = {
  id: string;
  name: string;
  type: BusinessType;
  status: BusinessStatus;
  registrationNo: string | null;
  description: string | null;
  contactNo: string;
  addressLine: string;
  city: string;
  district: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  owner: { id: string; fullName: string; email: string; phone: string | null };
  verification: {
    status: VerificationStatus;
    documentUrl: string | null;
    submittedAt: string;
    reviewedAt: string | null;
    remarks: string | null;
  } | null;
};

// ---------- users ----------
// Matches enum UserStatus in the database. The admin can only switch between ACTIVE and BLOCKED.
export const USER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// POST /admin/users/:id/status
export const setUserStatusSchema = z.object({ status: z.enum(["ACTIVE", "BLOCKED"]) });
export type SetUserStatusInput = z.infer<typeof setUserStatusSchema>;

// GET /admin/users
export type AdminUserDto = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  businessName: string | null;
};

// ---------- categories ----------
export const B2B_SUITABILITIES = ["SUITABLE", "RESTRICTED", "UNSUITABLE"] as const;
export type B2BSuitabilityName = (typeof B2B_SUITABILITIES)[number];

// POST /admin/categories
export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  description: z.string().trim().max(200).optional(),
  b2bSuitability: z.enum(B2B_SUITABILITIES).default("SUITABLE"),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// PATCH /admin/categories/:id  (send only what changes)
export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(60),
    description: z.string().trim().max(200),
    b2bSuitability: z.enum(B2B_SUITABILITIES),
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// GET /admin/categories (includes hidden categories)
export type AdminCategoryDto = {
  id: string;
  name: string;
  description: string | null;
  b2bSuitability: B2BSuitabilityName;
  isActive: boolean;
  listingCount: number;
};
