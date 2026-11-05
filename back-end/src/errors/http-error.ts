export class HttpError extends Error {
    constructor(
        readonly status: number,
        message: string,
        // Extra fields sent with the message, such as validation errors passed on from the orders service.
        readonly details: Record<string, unknown> = {},
    ) {
        super(message);
        this.name = 'HttpError';
    }
}
