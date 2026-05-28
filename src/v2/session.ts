import { Session as V1Session, type SessionOptions } from "../v1/session.js";
import { DOWNLOAD_REQUEST_HEADERS } from "./constants.js";

export class Session extends V1Session {
  constructor(options: SessionOptions = {}) {
    super({
      ...options,
      headers: options.headers ?? DOWNLOAD_REQUEST_HEADERS
    });
  }

  override async ensureCookiesAreAssigned(): Promise<boolean> {
    return true;
  }

  override async fetchAppInfo(): Promise<never> {
    throw new Error("This functionality is only available to v1 Session.");
  }
}
