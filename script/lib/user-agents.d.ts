export type UAOpts = NonNullable<
	ConstructorParameters<typeof import("@npm/user-agents").default>[0]
>;
