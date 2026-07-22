export class DbIntegrityError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "DbIntegrityError";
  }
}

export class OptimisticLockError extends DbIntegrityError {
  constructor() {
    super("Record was modified by another operation. Refresh and try again.", "OPTIMISTIC_LOCK");
  }
}

export class DuplicateTransactionError extends DbIntegrityError {
  constructor(public readonly existingId?: number) {
    super("A similar transaction already exists for this date.", "DUPLICATE_TRANSACTION");
  }
}

export class ReferentialIntegrityError extends DbIntegrityError {
  constructor(detail: string) {
    super(detail, "REFERENTIAL_INTEGRITY");
  }
}
