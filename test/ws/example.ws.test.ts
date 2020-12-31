/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import got from "got";
import { ExecutionResult } from "graphql";
import WebSocket from "ws";
import { GraphQLClientWebSocket, GraphQLReader } from "../../src";
import { requireExampleServer } from "../util";

describe("The example", () => {
  let operations: string;

  requireExampleServer();

  before(async () => {
    const reader = new GraphQLReader();
    operations = await reader.readDir(
      `${__dirname}/../../examples/client/operations`
    );
  });

  it("should serve GraphQL subscriptions over (unmanaged) web sockets", async () => {
    const socket = new WebSocket(
      "ws://localhost:4999/graphql",
      "graphql-transport-ws"
    );

    const closed = new Promise((resolve) => {
      socket.on("close", (code, reason) => {
        resolve([code, reason]);
      });
    });

    const gqlSocket = new GraphQLClientWebSocket({
      socket,
    });

    const results: ExecutionResult<any, any>[] = [];

    const iterator = await gqlSocket.subscribe<ExecutionResult>({
      query: operations,
      operationName: "NewReviews",
      variables: {
        limit: 2,
      },
    });

    const complete = (async () => {
      for await (const result of iterator) {
        results.push(result);
      }
    })();

    await got("http://localhost:4999/graphql", {
      method: "POST",
      json: {
        query: operations,
        operationName: "CreateBossReview",
        variables: {
          input: {
            author: "tester",
            bossId: "1",
            difficulty: "IMPOSSIBLE",
            theme: "ALRIGHT",
          },
        },
      },
      responseType: "json",
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    await got("http://localhost:4999/graphql", {
      method: "POST",
      json: {
        query: operations,
        operationName: "CreateLocationReview",
        variables: {
          input: {
            author: "tester",
            locationId: "13",
            difficulty: "HARD",
            design: "STELLAR",
          },
        },
      },
      responseType: "json",
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    await complete;

    gqlSocket.close(1000, "Normal Closure");

    assert.deepStrictEqual(await closed, [1000, "Normal Closure"]);

    assert.strictEqual(results.length, 2);
    assert.deepStrictEqual(
      results.map((it) => ({
        ...it,
        data: {
          newReviews: {
            ...it.data?.newReviews,
            createdAt: "test",
            id: "test",
          },
        },
      })),
      [
        {
          data: {
            newReviews: {
              __typename: "BossReview",
              author: "tester",
              boss: {
                id: "1",
                name: "Asylum Demon",
              },
              createdAt: "test",
              difficulty: "IMPOSSIBLE",
              id: "test",
              theme: "ALRIGHT",
            },
          },
        },
        {
          data: {
            newReviews: {
              __typename: "LocationReview",
              author: "tester",
              location: {
                id: "13",
                name: "Undead Parish",
              },
              createdAt: "test",
              difficulty: "HARD",
              id: "test",
              design: "STELLAR",
            },
          },
        },
      ]
    );
  });
});
