import type { MembershipRole, UserRole } from "@sahelia/database";

export interface RequestUser {
  userId: string;
  email: string;
  role: UserRole;
  businessId: string | null;
  membershipRole: MembershipRole | null;
  sessionId: string;
}

export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  business: {
    id: string;
    name: string;
    slug: string;
    membershipRole: MembershipRole;
  } | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  profile: AuthProfile;
}
