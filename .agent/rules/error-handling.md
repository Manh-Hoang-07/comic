# Error Handling Standards

## Standard Exceptions
- Use built-in NestJS exceptions (e.g., `NotFoundException`, `BadRequestException`, `ForbiddenException`).
- For business logic errors, consider creating custom exception classes extending `HttpException`.

## Validation Errors
- Rely on `ValidationPipe` with `class-validator` for DTO validation.
- Ensure informative error messages are returned for client-side debugging.

## Global Error Filter
- All unhandled errors are caught by the global `HttpExceptionFilter`.
- This filter ensures a consistent JSON error response format:
  ```json
  {
    "statusCode": 400,
    "message": "Error description",
    "timestamp": "ISO-8601",
    "path": "/api/..."
  }
  ```

## Logging
- Log meaningful errors in services using a logger (e.g., `Winston` or NestJS `Logger`).
- Do not log sensitive information like passwords or PII.
