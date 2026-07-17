export interface BrokeredIdentity {
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
}

export interface IdentityBrokerProvider {
  getAuthorizationUrl(params: { state: string; redirectUri: string }): string;
  exchangeCodeForIdentity(params: {
    code: string;
    redirectUri: string;
  }): Promise<BrokeredIdentity>;
}

export const IDENTITY_BROKER_PROVIDER = 'IDENTITY_BROKER_PROVIDER';
