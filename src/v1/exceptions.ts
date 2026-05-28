export class MovieboxApiException extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class UnsuccessfulResponseError extends MovieboxApiException {
  readonly response: Response;

  constructor(response: Response, message: string) {
    super(message);
    this.response = response;
  }
}

export class EmptyResponseError extends MovieboxApiException {
  readonly response?: Response;

  constructor(response: Response | undefined, message: string) {
    super(message);
    this.response = response;
  }
}

export class ExhaustedSearchResultsError extends MovieboxApiException {
  readonly lastPager: unknown;

  constructor(lastPager: unknown, message: string) {
    super(message);
    this.lastPager = lastPager;
  }
}

export class ZeroSearchResultsError extends MovieboxApiException {}
export class ZeroCaptionFileError extends MovieboxApiException {}
export class ZeroMediaFileError extends MovieboxApiException {}
