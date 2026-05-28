import { MovieboxApiException } from "../v1/exceptions.js";

export * from "../v1/exceptions.js";

export class InvalidDetailPathError extends MovieboxApiException {}
