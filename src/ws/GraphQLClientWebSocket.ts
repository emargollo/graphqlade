import type {
  CompleteMessage,
  ConnectionAckMessage,
  ErrorMessage,
  GraphQLWebSocketClientMessage,
  NextMessage,
  SubscribeMessage,
} from "./GraphQLWebSocketMessage";
import { DeferredPromise } from "../util/DeferredPromise";
import { assertType, assertRecord } from "../util/assert";
import { AsyncPushIterator } from "../util/AsyncPushIterator";

export interface GraphQLClientWebSocketOptions {
  socket: WebSocketLike;
  connectionAckTimeout: number;
}

export type WebSocketLike = Pick<
  WebSocket,
  "addEventListener" | "send" | "close" | "readyState" | "OPEN" | "CONNECTING"
>;

export type SubscribePayload = SubscribeMessage["payload"];

export class GraphQLClientWebSocket {
  public readonly socket: WebSocketLike;
  protected connectionAckWaitTimeout: number;
  protected connectionAckWaitTimeoutId?: NodeJS.Timeout;
  protected connectionAckPayload = new DeferredPromise<
    Record<string, unknown> | null | undefined
  >();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected subscriptions = new Map<string, AsyncPushIterator<any>>();
  protected nextSubscriptionId = 1;

  constructor(options: GraphQLClientWebSocketOptions) {
    this.socket = options.socket;
    this.connectionAckWaitTimeout = options.connectionAckTimeout;

    this.setup();
  }

  init(connectionInitPayload?: Record<string, unknown>) {
    this.connectionAckWaitTimeoutId = setTimeout(() => {
      this.close(4408, "Connection acknowledgement timeout");
    }, this.connectionAckWaitTimeout);

    if (this.isOpen()) {
      this.send({
        type: "connection_init",
        payload: connectionInitPayload,
      });
    } else {
      this.socket.addEventListener("open", () => {
        this.send({
          type: "connection_init",
          payload: connectionInitPayload,
        });
      });
    }

    return this;
  }

  subscribe<TExecutionResult>(payload: SubscribePayload) {
    return new AsyncPushIterator<TExecutionResult>(async (it) => {
      await this.requireAck();

      const id = (this.nextSubscriptionId++).toString();
      this.subscriptions.set(id, it);

      this.send({
        type: "subscribe",
        id,
        payload,
      });

      return () => {
        this.send({ type: "complete", id });
        setTimeout(() => {
          this.subscriptions.delete(id);
        }, 3000);
      };
    });
  }

  // event handlers

  async handleClose(event: CloseEvent) {
    if (this.connectionAckWaitTimeoutId) {
      clearTimeout(this.connectionAckWaitTimeoutId);
    }

    this.connectionAckPayload.reject(
      new Error(`Web socket closed: ${event.code} ${event.reason}`)
    );

    for (const [, subscription] of this.subscriptions) {
      subscription.throw(this.makeClosingError(event.code, event.reason));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleError(event: Event) {
    if (this.connectionAckWaitTimeoutId) {
      clearTimeout(this.connectionAckWaitTimeoutId);
    }

    this.connectionAckPayload.reject(new Error("Web socket error"));

    for (const [, subscription] of this.subscriptions) {
      subscription.throw(new Error("Web socket error"));
    }
  }

  async handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data.toString());

      assertRecord(message);

      switch (message.type) {
        case "connection_ack":
          this.handleConnectionAckMessage(
            this.parseConnectionAckMessage(message)
          );
          break;
        case "next":
        case "data": // legacy
          this.handleNextMessage(this.parseNextMessage(message));
          break;
        case "error":
          this.handleErrorMessage(this.parseErrorMessage(message));
          break;
        case "complete":
        case "stop": // legacy
          this.handleCompleteMessage(this.parseCompleteMessage(message));
          break;
        default:
          this.close(4400, `Invalid message type ${message.type}`);
      }
    } catch (err) {
      this.closeByError(err);
    }
  }

  // message handlers

  handleConnectionAckMessage(message: ConnectionAckMessage) {
    if (this.connectionAckWaitTimeoutId) {
      clearTimeout(this.connectionAckWaitTimeoutId);
      this.connectionAckWaitTimeoutId = undefined;
    }

    this.connectionAckPayload.resolve(message.payload);
  }

  handleNextMessage(message: NextMessage) {
    this.requireSubscription(message.id).push(message.payload);
  }

  handleErrorMessage(message: ErrorMessage) {
    this.requireSubscription(message.id).throw(
      new Error(
        `Subscription error: ${message.payload
          .map((it) => it.message)
          .join(" / ")}`
      )
    );
  }

  handleCompleteMessage(message: CompleteMessage) {
    this.requireSubscription(message.id).finish();
  }

  // message parsers

  parseConnectionAckMessage(
    message: Record<string, unknown>
  ): ConnectionAckMessage {
    if (typeof message.payload !== "undefined" && message.payload !== null) {
      assertRecord(message.payload);
    }

    return {
      type: "connection_ack",
      payload: message.payload,
    };
  }

  parseNextMessage(message: Record<string, unknown>): NextMessage {
    assertType(typeof message.id === "string");
    assertRecord(message.payload);

    return {
      type: "next",
      id: message.id,
      payload: message.payload,
    };
  }

  parseErrorMessage(message: Record<string, unknown>): ErrorMessage {
    assertType(typeof message.id === "string");
    assertType(Array.isArray(message.payload));

    for (const error of message.payload) {
      assertType(typeof error.message === "string");
    }

    return {
      type: "error",
      id: message.id,
      payload: message.payload,
    };
  }

  parseCompleteMessage(message: Record<string, unknown>): CompleteMessage {
    assertType(typeof message.id === "string");

    return {
      type: "complete",
      id: message.id,
    };
  }

  // helpers

  async requireAck() {
    const payload = await this.connectionAckPayload;

    return payload ?? undefined;
  }

  requireSubscription(id: string) {
    const subscription = this.subscriptions.get(id);

    if (!subscription) {
      throw this.makeClosingError(4409, `Subscriber for ${id} does not exist`);
    }

    return subscription;
  }

  // low-level

  protected setup() {
    this.socket.addEventListener("close", (e) => this.handleClose(e));
    this.socket.addEventListener("error", (e) => this.handleError(e));
    this.socket.addEventListener("message", (e) => this.handleMessage(e));
  }

  closeByError(err: Error & { code?: number }) {
    if (typeof err.code === "number") {
      this.close(err.code, err.message);
    } else if (err instanceof TypeError) {
      this.close(4400, `Invalid message: ${err.message}`);
    } else {
      this.close(1011, `Internal server error: ${err.message}`);
    }
  }

  send(message: GraphQLWebSocketClientMessage) {
    if (this.isOpen()) this.socket.send(JSON.stringify(message));
  }

  close(code: number, reason: string) {
    if (this.isOpenOrConnecting()) this.socket.close(code, reason);
  }

  isOpenOrConnecting() {
    return (
      this.socket.readyState === this.socket.OPEN ||
      this.socket.readyState === this.socket.CONNECTING
    );
  }

  isOpen() {
    return this.socket.readyState === this.socket.OPEN;
  }

  makeClosingError(code: number, reason: string) {
    return Object.assign(new Error(reason), { code });
  }
}
