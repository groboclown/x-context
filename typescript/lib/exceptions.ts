
/**
 * Top-level error used by the execution context.
 */
export class ExecutionContextError extends Error {
  readonly wrapped: Error | undefined;
  readonly date: Date;

  constructor(msg: string, wrapped?: Error) {
    super(msg);
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, ExecutionContextError);

    this.wrapped = wrapped || undefined;
    this.date = new Date();
  }
}

/**
 * General category for registry errors.
 */
export class ExecutionContextRegistryError extends ExecutionContextError {
  readonly registryKind: string;

  constructor(msg: string, registryKind: string) {
    super(msg);
    Error.captureStackTrace(this, ExecutionContextRegistryError);
    this.registryKind = registryKind;
  }
}


/**
 * Attempted to register an already registered context kind.
 */
export class ExecutionContextAlreadyRegisteredError extends ExecutionContextRegistryError {
  readonly registerSource: Error;

  constructor(registryKind: string, source: Error) {
    super(
      `Attempted to register execution context kind '${registryKind}', but it was already registered.`,
      registryKind
    );
    Error.captureStackTrace(this, ExecutionContextAlreadyRegisteredError);
    this.registerSource = source;
  }
}


/**
 * Attempted to find an execution context of a specific kind, but it wasn't
 * registered.
 */
export class ExecutionContextNotRegisteredError extends ExecutionContextRegistryError {
  constructor(registryKind: string) {
    super(
      `No execution context kind '${registryKind}' registered.`,
      registryKind
    );
    Error.captureStackTrace(this, ExecutionContextNotRegisteredError);
  }
}


/**
 * General category for error occurring when entering a child context.
 */
export class ExecutionContextEnteredError extends ExecutionContextError {
  constructor(msg: string, wrapped?: Error) {
    super(msg, wrapped);
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, ExecutionContextEnteredError);
  }
}


/**
 * The child context contained multple run context instances
 */
export class DuplicateExecutionContextSegmentsError extends ExecutionContextEnteredError {
  public readonly kind: string;

  constructor(kind: string) {
    super(`Added multiple segments into the current Execution Context with kind ${kind}`);
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, DuplicateExecutionContextSegmentsError);
    this.kind = kind;
  }
}


/**
 * General category for error occurring when leaving a child context.
 */
export class ExecutionContextExitedError extends ExecutionContextError {
  constructor(msg: string, wrapped?: Error) {
    super(msg, wrapped);
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, ExecutionContextExitedError);
  }
}


/**
 * General category for error occurring when leaving a child context.
 */
export class ExecutionContextStackEmptyError extends ExecutionContextExitedError {
  constructor() {
    super(`No active execution context for this thread.`);
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, ExecutionContextStackEmptyError);
  }
}
