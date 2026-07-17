import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  BrokeredIdentity,
  IdentityBrokerProvider,
} from '../interfaces/identity-broker.interface';

@Injectable()
export class KeycloakIdentityBrokerProvider implements IdentityBrokerProvider {
  private get realmBaseUrl() {
    return `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}`;
  }

  getAuthorizationUrl({
    state,
    redirectUri,
  }: {
    state: string;
    redirectUri: string;
  }): string {
    const params = new URLSearchParams({
      client_id: process.env.KEYCLOAK_BACKEND_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      kc_idp_hint: 'google',
      state,
    });
    return `${this.realmBaseUrl}/protocol/openid-connect/auth?${params.toString()}`;
  }

  async exchangeCodeForIdentity({
    code,
    redirectUri,
  }: {
    code: string;
    redirectUri: string;
  }): Promise<BrokeredIdentity> {
    const tokenRes = await axios.post(
      `${this.realmBaseUrl}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.KEYCLOAK_BACKEND_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_BACKEND_CLIENT_SECRET!,
      }),
    );

    const userinfoRes = await axios.get(
      `${this.realmBaseUrl}/protocol/openid-connect/userinfo`,
      {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      },
    );

    return {
      providerUserId: userinfoRes.data.sub,
      email: userinfoRes.data.email,
      emailVerified: userinfoRes.data.email_verified,
      name: userinfoRes.data.name,
    };
  }
}
