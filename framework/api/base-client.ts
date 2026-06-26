import type { APIRequestContext, APIResponse } from "@playwright/test";

import { getLogger } from "@framework/utils/logger";

/**
 * Thin wrapper around Playwright's `APIRequestContext`.
 *
 * Provides URL composition, structured logging, and verb shortcuts. Subclass
 * per resource family (e.g. `UsersClient`, `OrdersClient`) and expose
 * domain-specific methods that return typed objects where useful.
 */
export class BaseAPIClient {
  protected readonly request: APIRequestContext;
  protected readonly baseUrl: string;
  protected readonly log = getLogger(this.constructor.name);

  constructor(request: APIRequestContext, baseUrl: string) {
    this.request = request;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  protected url(path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  get(path: string, options?: Parameters<APIRequestContext["get"]>[1]): Promise<APIResponse> {
    const url = this.url(path);
    this.log.info("api_request", { method: "GET", url });
    return this.request.get(url, options);
  }

  post(path: string, options?: Parameters<APIRequestContext["post"]>[1]): Promise<APIResponse> {
    const url = this.url(path);
    this.log.info("api_request", { method: "POST", url });
    return this.request.post(url, options);
  }

  put(path: string, options?: Parameters<APIRequestContext["put"]>[1]): Promise<APIResponse> {
    const url = this.url(path);
    this.log.info("api_request", { method: "PUT", url });
    return this.request.put(url, options);
  }

  patch(path: string, options?: Parameters<APIRequestContext["patch"]>[1]): Promise<APIResponse> {
    const url = this.url(path);
    this.log.info("api_request", { method: "PATCH", url });
    return this.request.patch(url, options);
  }

  delete(path: string, options?: Parameters<APIRequestContext["delete"]>[1]): Promise<APIResponse> {
    const url = this.url(path);
    this.log.info("api_request", { method: "DELETE", url });
    return this.request.delete(url, options);
  }

  /** Assert a response is OK, raising with status + truncated body otherwise. */
  static async expectOk(response: APIResponse): Promise<APIResponse> {
    if (!response.ok()) {
      const body = (await response.text()).slice(0, 500);
      throw new Error(
        `API call failed: ${response.status()} ${response.statusText()} -> ${response.url()}\nbody: ${body}`,
      );
    }
    return response;
  }
}
