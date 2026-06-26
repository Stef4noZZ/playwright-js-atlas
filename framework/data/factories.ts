import { faker } from "@faker-js/faker";

import { AddressSchema, UserSchema, type Address, type User } from "@framework/data/models";

/**
 * Faker-driven builders that return validated model objects. Pass overrides to
 * pin any field. Mirrors `framework/data/factories.py` in the pytest atlas.
 */

export function makeAddress(overrides: Partial<Address> = {}): Address {
  return AddressSchema.parse({
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    postalCode: faker.location.zipCode(),
    country: faker.location.countryCode(),
    ...overrides,
  });
}

export function makeUser(overrides: Partial<User> = {}): User {
  return UserSchema.parse({
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number(),
    ...overrides,
  });
}
