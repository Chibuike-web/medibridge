"use client";

import { User } from "better-auth";
import { createContext, ReactNode, use } from "react";

const UserContext = createContext<User | null>(null);

export function useUserContext() {
	const session = use(UserContext);

	if (!session) {
		console.error("useUserContext must be used within a UserContextProvider");
	}

	return session;
}

export default function UserContextProvider({
	children,
	user,
}: {
	children: ReactNode;
	user: User;
}) {
	return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
