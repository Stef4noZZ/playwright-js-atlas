import { z } from "zod";

/**
 * Shared schemas for test data and API payloads.
 *
 * The TS/JS analogue of the pytest atlas's Pydantic models. Zod gives the same
 * runtime validation plus static types inferred via `z.infer`. Use `.parse()`
 * to validate API responses or factory output at the boundary.
 */

export const AddressSchema = z
  .object({
    street: z.string(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string().default("US"),
  })
  .strict();

export type Address = z.infer<typeof AddressSchema>;

export const UserSchema = z
  .object({
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    address: AddressSchema.optional(),
    tags: z.array(z.string()).default([]),
  })
  .strict();

export type User = z.infer<typeof UserSchema>;

export function fullName(user: Pick<User, "firstName" | "lastName">): string {
  return `${user.firstName} ${user.lastName}`;
}

// --- Sample response shapes (jsonplaceholder.typicode.com) -------------------
// Used purely to type the example client. Replace with your own when adapting.

export interface JsonPlaceholderUser {
  id: number;
  name: string;
  username: string;
  email: string;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}
