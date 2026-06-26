import { BaseAPIClient } from "@framework/api/base-client";
import type { JsonPlaceholderUser, Post } from "@framework/data/models";

/**
 * Sample client against https://jsonplaceholder.typicode.com.
 *
 * A read-only public API used purely to demonstrate the API layer. Replace
 * with your own client(s) when adapting the archetype. Mirrors
 * `JsonPlaceholderClient` in the pytest atlas.
 */
export class JsonPlaceholderClient extends BaseAPIClient {
  async listUsers(): Promise<JsonPlaceholderUser[]> {
    const response = await BaseAPIClient.expectOk(await this.get("/users"));
    return (await response.json()) as JsonPlaceholderUser[];
  }

  async getUser(userId: number): Promise<JsonPlaceholderUser> {
    const response = await BaseAPIClient.expectOk(await this.get(`/users/${userId}`));
    return (await response.json()) as JsonPlaceholderUser;
  }

  async listPosts(userId?: number): Promise<Post[]> {
    const options = userId !== undefined ? { params: { userId } } : undefined;
    const response = await BaseAPIClient.expectOk(await this.get("/posts", options));
    return (await response.json()) as Post[];
  }
}
