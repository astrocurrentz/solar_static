export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export class ConfigError extends UserFacingError {
  override name = "ConfigError";
}

export class NotionApiError extends UserFacingError {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(`Notion API ${status} ${code}: ${message}`);
    this.name = "NotionApiError";
    this.status = status;
    this.code = code;
  }
}

export class ConflictError extends UserFacingError {
  override name = "ConflictError";
}
