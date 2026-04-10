import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_URL,
	plugins: [adminClient(), organizationClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
