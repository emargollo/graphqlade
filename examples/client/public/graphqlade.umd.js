(function (root, factory) {
  var definitions = {};

  function staticDefine(id, dependencies, factory) {
    definitions[id] = {
      id: id,
      dependencies: dependencies,
      factory: factory,
      exports: {},
      loaded: false,
    };
  }

  function staticRequire(id) {
    var definition = definitions[id];

    if (!definition.loaded) {
      definition.loaded = true;

      try {
        var returnExports = definition.factory.apply(
          undefined,
          definition.dependencies.map(function (id) {
            switch (id) {
              case "require":
                return staticRequire;
              case "exports":
                return definition.exports;
              case "module":
                return definition;
              default:
                return staticRequire(id);
            }
          })
        );
      } catch (err) {
        definition.loaded = false;
        throw err;
      }

      if (returnExports) definition.exports = returnExports;
    }

    return definition.exports;
  }

  if (typeof define === "function" && define.amd) {
    factory(define);
  } else if (
    typeof exports === "object" &&
    typeof exports.nodeName !== "string"
  ) {
    factory(staticDefine);
    Object.assign(exports, staticRequire("graphqlade/dist/browser"));
  } else {
    factory(staticDefine);
    root.graphqlade = staticRequire("graphqlade/dist/browser");
  }
})(typeof self !== "undefined" ? self : this, function (define) {
  var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P
          ? value
          : new P(function (resolve) {
              resolve(value);
            });
      }
      return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done
            ? resolve(result.value)
            : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
  var __asyncValues =
    (this && this.__asyncValues) ||
    function (o) {
      if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
      var m = o[Symbol.asyncIterator],
        i;
      return m
        ? m.call(o)
        : ((o =
            typeof __values === "function"
              ? __values(o)
              : o[Symbol.iterator]()),
          (i = {}),
          verb("next"),
          verb("throw"),
          verb("return"),
          (i[Symbol.asyncIterator] = function () {
            return this;
          }),
          i);
      function verb(n) {
        i[n] =
          o[n] &&
          function (v) {
            return new Promise(function (resolve, reject) {
              (v = o[n](v)), settle(resolve, reject, v.done, v.value);
            });
          };
      }
      function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function (v) {
          resolve({ value: v, done: d });
        }, reject);
      }
    };
  var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
      ? function (o, m, k, k2) {
          if (k2 === undefined) k2 = k;
          Object.defineProperty(o, k2, {
            enumerable: true,
            get: function () {
              return m[k];
            },
          });
        }
      : function (o, m, k, k2) {
          if (k2 === undefined) k2 = k;
          o[k2] = m[k];
        });
  var __exportStar =
    (this && this.__exportStar) ||
    function (m, exports) {
      for (var p in m)
        if (
          p !== "default" &&
          !Object.prototype.hasOwnProperty.call(exports, p)
        )
          __createBinding(exports, m, p);
    };
  define("ws/GraphQLWebSocketMessage", [
    "require",
    "exports",
  ], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  });
  define("util/DeferredPromise", [
    "require",
    "exports",
  ], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeferredPromise = void 0;
    class DeferredPromise {
      constructor() {
        this.promise = new Promise((resolve, reject) => {
          this.resolvePromise = resolve;
          this.rejectPromise = reject;
        });
        this.then = (...args) => this.promise.then(...args);
        this.catch = (...args) => this.promise.catch(...args);
        this.finally = (...args) => this.promise.finally(...args);
      }
      resolve(value) {
        this.resolvePromise(value);
      }
      reject(reason) {
        this.rejectPromise(reason);
      }
    }
    exports.DeferredPromise = DeferredPromise;
  });
  define("util/assert", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertType = exports.assertDefined = exports.assertRecord = void 0;
    function assertRecord(value, message) {
      const m =
        message !== null && message !== void 0 ? message : "Expected record";
      assertType(value !== null, m);
      assertType(typeof value === "object", m);
      assertType(!Array.isArray(value), m);
    }
    exports.assertRecord = assertRecord;
    function assertDefined(input, message) {
      assertType(
        input !== null && typeof input !== "undefined",
        message !== null && message !== void 0
          ? message
          : "Unexpected null/undefined value"
      );
    }
    exports.assertDefined = assertDefined;
    function assertType(condition, message) {
      if (!condition)
        throw new TypeError(
          message !== null && message !== void 0 ? message : "Assertion failed"
        );
    }
    exports.assertType = assertType;
  });
  define("util/AsyncPushIterator", [
    "require",
    "exports",
  ], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AsyncPushIterator = void 0;
    class AsyncPushIterator {
      constructor(setup) {
        this.initialized = false;
        this.finished = false;
        this.done = false;
        this.queue = [];
        this.setup = setup;
      }
      next() {
        return __awaiter(this, void 0, void 0, function* () {
          if (!this.initialized) {
            this.initialized = true;
            this.teardown = yield this.setup(this);
          }
          if (this.error) throw this.error;
          if (this.done) return { done: true, value: undefined };
          if (this.queue.length > 0) {
            const value = this.queue.shift();
            return { done: false, value };
          } else if (this.finished) {
            return this.return();
          }
          yield this.wait(); // never throws
          return this.next();
        });
      }
      return() {
        return __awaiter(this, void 0, void 0, function* () {
          if (!this.done) {
            this.done = true;
            this.finished = true;
            this.teardownOnce();
            this.continue();
          }
          return { done: true, value: undefined };
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw(err) {
        return __awaiter(this, void 0, void 0, function* () {
          if (!this.done) {
            this.done = true;
            this.error = err;
            this.teardownOnce();
            this.continue();
          }
          throw err;
        });
      }
      [Symbol.asyncIterator]() {
        return this;
      }
      //
      push(value) {
        if (this.finished) return;
        this.queue.push(value);
        this.continue();
      }
      finish() {
        if (!this.finished) {
          this.finished = true;
          this.continue();
        }
      }
      //
      wait() {
        if (!this.waiting) {
          this.waiting = new Promise((resolve) => {
            this.resolveWait = resolve;
          });
        }
        return this.waiting;
      }
      continue() {
        if (!this.resolveWait) return;
        this.resolveWait();
        this.resolveWait = undefined;
        this.waiting = undefined;
      }
      teardownOnce() {
        if (!this.teardown) return;
        try {
          this.teardown();
        } catch (err) {
          // may hide original error, but errors during teardown
          // are more critical and need to be fixed first
          this.error = err;
        } finally {
          this.teardown = undefined;
        }
      }
    }
    exports.AsyncPushIterator = AsyncPushIterator;
  });
  define("ws/GraphQLClientWebSocket", [
    "require",
    "exports",
    "util/DeferredPromise",
    "util/assert",
    "util/AsyncPushIterator",
  ], function (require, exports, DeferredPromise_1, assert_1, AsyncPushIterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GraphQLClientWebSocket = void 0;
    class GraphQLClientWebSocket {
      constructor(options) {
        var _a;
        this.connectionAckPayload = new DeferredPromise_1.DeferredPromise();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.subscriptions = new Map();
        this.nextSubscriptionId = 1;
        this.socket = options.socket;
        this.connectionInitPayload = options.connectionInitPayload;
        this.connectionAckWaitTimeout =
          (_a = options.connectionAckTimeout) !== null && _a !== void 0
            ? _a
            : 3000;
        this.setup();
      }
      setup() {
        this.socket.addEventListener("close", (e) => this.handleClose(e));
        this.socket.addEventListener("error", (e) => this.handleError(e));
        this.socket.addEventListener("message", (e) => this.handleMessage(e));
        this.connectionAckWaitTimeoutId = setTimeout(() => {
          this.close(4408, "Connection acknowledgement timeout");
        }, this.connectionAckWaitTimeout);
        if (this.isOpen()) {
          this.send({
            type: "connection_init",
            payload: this.connectionInitPayload,
          });
        } else {
          this.socket.addEventListener("open", () => {
            this.send({
              type: "connection_init",
              payload: this.connectionInitPayload,
            });
          });
        }
      }
      // public
      subscribe(payload) {
        return __awaiter(this, void 0, void 0, function* () {
          yield this.requireAck();
          return new AsyncPushIterator_1.AsyncPushIterator((it) =>
            __awaiter(this, void 0, void 0, function* () {
              const id = (this.nextSubscriptionId++).toString();
              this.subscriptions.set(id, it);
              this.send({
                type: "subscribe",
                id,
                payload,
              });
              return () => {
                this.send({ type: "complete", id });
              };
            })
          );
        });
      }
      // event handlers
      handleClose(event) {
        return __awaiter(this, void 0, void 0, function* () {
          if (this.connectionAckWaitTimeoutId) {
            clearTimeout(this.connectionAckWaitTimeoutId);
          }
          this.connectionAckPayload.reject(new Error("CLOSED"));
          for (const [, subscription] of this.subscriptions) {
            subscription.throw(
              this.makeProtocolError(event.code, event.reason)
            );
          }
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      handleError(event) {
        return __awaiter(this, void 0, void 0, function* () {
          if (this.connectionAckWaitTimeoutId) {
            clearTimeout(this.connectionAckWaitTimeoutId);
          }
          this.connectionAckPayload.reject(new Error("CLOSED"));
          for (const [, subscription] of this.subscriptions) {
            subscription.throw(new Error("WebSocket error"));
          }
        });
      }
      handleMessage(event) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const message = JSON.parse(event.data.toString());
            assert_1.assertRecord(message);
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
                throw new TypeError(`Invalid message type ${message.type}`);
            }
          } catch (err) {
            this.closeByError(err);
          }
        });
      }
      // message handlers
      handleConnectionAckMessage(message) {
        if (this.connectionAckWaitTimeoutId) {
          clearTimeout(this.connectionAckWaitTimeoutId);
        }
        this.connectionAckPayload.resolve(message.payload);
      }
      handleNextMessage(message) {
        this.requireSubscription(message.id).push(message.payload);
      }
      handleErrorMessage(message) {
        this.requireSubscription(message.id).throw(
          new Error(
            `Subscription error: ${message.payload
              .map((it) => it.message)
              .join(" / ")}`
          )
        );
      }
      handleCompleteMessage(message) {
        this.requireSubscription(message.id).finish();
      }
      // message parsers
      parseConnectionAckMessage(message) {
        if (
          typeof message.payload !== "undefined" &&
          message.payload !== null
        ) {
          assert_1.assertRecord(message.payload);
        }
        return {
          type: "connection_ack",
          payload: message.payload,
        };
      }
      parseNextMessage(message) {
        assert_1.assertType(typeof message.id === "string");
        assert_1.assertRecord(message.payload);
        return {
          type: "next",
          id: message.id,
          payload: message.payload,
        };
      }
      parseErrorMessage(message) {
        assert_1.assertType(typeof message.id === "string");
        assert_1.assertType(Array.isArray(message.payload));
        for (const error of message.payload) {
          assert_1.assertType(typeof error.message === "string");
        }
        return {
          type: "error",
          id: message.id,
          payload: message.payload,
        };
      }
      parseCompleteMessage(message) {
        assert_1.assertType(typeof message.id === "string");
        return {
          type: "complete",
          id: message.id,
        };
      }
      // helpers
      requireAck() {
        return __awaiter(this, void 0, void 0, function* () {
          const payload = yield this.connectionAckPayload;
          return payload !== null && payload !== void 0 ? payload : undefined;
        });
      }
      requireSubscription(id) {
        const subscription = this.subscriptions.get(id);
        if (!subscription) {
          throw this.makeProtocolError(
            4409,
            `Subscriber for ${id} does not exist`
          );
        }
        return subscription;
      }
      // low-level
      send(message) {
        if (this.isOpen()) this.socket.send(JSON.stringify(message));
      }
      closeByError(err) {
        if (err.message === "CLOSED") {
          // we're good
        } else if (typeof err.code === "number") {
          this.close(err.code, err.message);
        } else if (err instanceof TypeError) {
          this.close(4400, `Invalid message: ${err.message}`);
        } else {
          this.close(1011, `Internal server error: ${err.message}`);
        }
      }
      close(code, reason) {
        if (this.isOpen()) this.socket.close(code, reason);
      }
      isOpen() {
        return this.socket.readyState === this.socket.OPEN;
      }
      makeProtocolError(code, reason) {
        return Object.assign(new Error(reason), { code });
      }
    }
    exports.GraphQLClientWebSocket = GraphQLClientWebSocket;
  });
  define("ws/GraphQLWebSocketClient", [
    "require",
    "exports",
    "ws/GraphQLClientWebSocket",
    "util/AsyncPushIterator",
  ], function (require, exports, GraphQLClientWebSocket_1, AsyncPushIterator_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GraphQLWebSocketClient = void 0;
    class GraphQLWebSocketClient {
      constructor(options) {
        var _a;
        this.subscriptions = new Set();
        this.explicitlyClosed = false;
        this.url = options.url;
        this.protocol = options.protocol;
        this.connect =
          (_a = options.connect) !== null && _a !== void 0
            ? _a
            : (url, protocol, connectionInitPayload) =>
                new GraphQLClientWebSocket_1.GraphQLClientWebSocket({
                  socket: new WebSocket(url, protocol),
                  connectionInitPayload,
                });
      }
      subscribe(payload, options) {
        this.explicitlyClosed = false;
        return new AsyncPushIterator_2.AsyncPushIterator((it) =>
          __awaiter(this, void 0, void 0, function* () {
            this.subscriptions.add(it);
            const {
              maxRetries = 0,
              minRetryDelay = 500,
              maxRetryDelay = 10000,
              delayMultiplier: exponentialBackoffMultiplier = 2,
            } = options !== null && options !== void 0 ? options : {};
            let retryTimeoutId;
            const run = (retries, retryDelay) =>
              __awaiter(this, void 0, void 0, function* () {
                var e_1, _a;
                try {
                  const socket = yield this.maybeConnect();
                  const results = yield socket.subscribe(payload);
                  try {
                    for (
                      var results_1 = __asyncValues(results), results_1_1;
                      (results_1_1 = yield results_1.next()), !results_1_1.done;

                    ) {
                      const result = results_1_1.value;
                      it.push(result);
                    }
                  } catch (e_1_1) {
                    e_1 = { error: e_1_1 };
                  } finally {
                    try {
                      if (
                        results_1_1 &&
                        !results_1_1.done &&
                        (_a = results_1.return)
                      )
                        yield _a.call(results_1);
                    } finally {
                      if (e_1) throw e_1.error;
                    }
                  }
                  it.finish();
                } catch (err) {
                  if (
                    !this.explicitlyClosed &&
                    retries > 0 &&
                    this.shouldRetry(err)
                  ) {
                    const nextRetryDelay = Math.floor(
                      Math.min(
                        exponentialBackoffMultiplier * retryDelay,
                        maxRetryDelay
                      ) +
                        Math.random() * minRetryDelay
                    );
                    retryTimeoutId = setTimeout(
                      () => run(retries - 1, nextRetryDelay),
                      retryDelay
                    );
                  } else {
                    it.throw(err);
                  }
                }
              });
            run(maxRetries, minRetryDelay);
            return () => {
              clearTimeout(retryTimeoutId);
              this.subscriptions.delete(it);
            };
          })
        );
      }
      close(code, reason) {
        var _a;
        (_a = this.socket) === null || _a === void 0
          ? void 0
          : _a.close(
              code !== null && code !== void 0 ? code : 1000,
              reason !== null && reason !== void 0 ? reason : "Normal Closure"
            );
        this.explicitlyClosed = true;
      }
      shouldRetry(err) {
        if (typeof err.code !== "number") return false;
        switch (err.code) {
          case 1002:
          case 1011:
          case 4400:
          case 4401:
          case 4409:
          case 4429:
            return false;
        }
        return false;
      }
      maybeConnect() {
        return __awaiter(this, void 0, void 0, function* () {
          // TODO isOpen is bad here
          if (!this.socket || !this.socket.isOpen()) {
            this.socket = this.connect(
              this.url,
              this.protocol,
              this.connectionInitPayload
            );
          }
          this.connectionAckPayload = yield this.socket.requireAck();
          return this.socket;
        });
      }
    }
    exports.GraphQLWebSocketClient = GraphQLWebSocketClient;
  });
  define("graphqlade/browser", [
    "require",
    "exports",
    "ws/GraphQLClientWebSocket",
    "ws/GraphQLWebSocketClient",
  ], function (require, exports, GraphQLClientWebSocket_2, GraphQLWebSocketClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-module name='graphqlade/browser'/>
    __exportStar(GraphQLClientWebSocket_2, exports);
    __exportStar(GraphQLWebSocketClient_1, exports);
  });
  //# sourceMappingURL=graphqlade.amd.js.map
});
