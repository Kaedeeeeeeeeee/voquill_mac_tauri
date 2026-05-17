import {
  User as FirebaseUser,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { invokeHandler } from "@voquill/functions";
import { AuthUser } from "../types/auth.types";
import { getEffectiveAuth } from "../utils/auth.utils";
import { BaseRepo } from "./base.repo";

export abstract class BaseAuthRepo extends BaseRepo {
  abstract signUpWithEmail(email: string, password: string): Promise<void>;
  abstract sendEmailVerificationForCurrentUser(): Promise<void>;
  abstract signOut(): Promise<void>;
  abstract signInWithEmail(email: string, password: string): Promise<void>;
  abstract sendPasswordResetRequest(email: string): Promise<void>;
  abstract signInWithGoogleTokens(
    idToken: string,
    accessToken: string,
  ): Promise<void>;
  abstract signInWithSsoTokens(payload: {
    token: string;
    refreshToken: string;
    authId: string;
    email: string;
  }): Promise<void>;
  abstract getCurrentUser(): AuthUser | null;
  abstract deleteMyAccount(): Promise<void>;
  abstract refreshTokens(): Promise<void>;
  abstract onAuthStateChanged(
    callback: (user: AuthUser | null) => void,
    onError: (error: Error) => void,
  ): () => void;
}

export class CloudAuthRepo extends BaseAuthRepo {
  async signUpWithEmail(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(getEffectiveAuth(), email, password);
  }

  async sendEmailVerificationForCurrentUser(): Promise<void> {
    const user = getEffectiveAuth().currentUser;
    if (!user) {
      throw new Error("No user is currently signed in.");
    }

    await sendEmailVerification(user);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(getEffectiveAuth());
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(getEffectiveAuth(), email, password);
  }

  async sendPasswordResetRequest(email: string): Promise<void> {
    await sendPasswordResetEmail(getEffectiveAuth(), email);
  }

  async signInWithGoogleTokens(
    idToken: string,
    accessToken: string,
  ): Promise<void> {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    await signInWithCredential(getEffectiveAuth(), credential);
  }

  async signInWithSsoTokens(): Promise<void> {
    throw new Error("SSO sign-in is not supported in cloud mode.");
  }

  private toAuthUser(firebaseUser: FirebaseUser | null): AuthUser | null {
    if (!firebaseUser) {
      return null;
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      providers: firebaseUser.providerData.map((p) => p.providerId),
    };
  }

  getCurrentUser(): AuthUser | null {
    return this.toAuthUser(getEffectiveAuth().currentUser);
  }

  async deleteMyAccount(): Promise<void> {
    await invokeHandler("user/deleteMyAccount", {});
  }

  async refreshTokens(): Promise<void> {
    // noop — Firebase handles token refresh internally
  }

  onAuthStateChanged(
    callback: (user: AuthUser | null) => void,
    onError: (error: Error) => void,
  ): () => void {
    return getEffectiveAuth().onAuthStateChanged(
      (firebaseUser) => callback(this.toAuthUser(firebaseUser)),
      (error) => onError(error),
    );
  }
}

