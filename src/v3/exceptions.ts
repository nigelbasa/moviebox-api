export class MovieboxApiException extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class MovieboxApiError extends MovieboxApiException {}

export class UnsuccessfulResponseError extends MovieboxApiException {
  readonly response: Response;

  constructor(response: Response, message: string) {
    super(message);
    this.response = response;
  }
}

export class ZeroSearchResultsError extends MovieboxApiException {}

export class ExhaustedSearchResultsError extends MovieboxApiException {
  readonly pager: unknown;

  constructor(pager: unknown, message: string) {
    super(message);
    this.pager = pager;
  }
}

export class ResultsNavigationError extends MovieboxApiException {}

export class ZeroCaptionFileError extends MovieboxApiException {}

export class ZeroMediaFileError extends MovieboxApiException {}

export class MissingDubError extends MovieboxApiException {}
