import { NextResponse } from "next/server";

const config = JSON.parse(process.env.BITTE_CONFIG || "{}");

export async function GET() {
  const pluginData = {
    openapi: "3.0.0",
    info: {
      title: "Veni; Vidi; Roasti",
      description: "API for the $ROASTI token and Twitter bot",
      version: "0.1.0",
    },
    servers: [
      {
        url: config.url,
      },
    ],
    "x-mb": {
      "account-id": "venividiroasti.near",
      email: "venividiroasti@proton.me",
      assistant: {
        name: "Veni; Vidi; Roasti",
        description: `
          An AI agent that facilitates $ROASTI token duels, tracks leaderboard stats, and manages roast battles between historical figures.
          Users can stake $ROASTI to challenge opponents in turn-based roast duels, where historical figures exchange AI-generated insults.
          The agent also provides memecoin transaction tools and duel tracking.
        `,
        instructions: `
          You handle $ROASTI token transactions, roast duels, and leaderboard tracking.
          When processing blockchain transactions, first generate a transaction payload, then explicitly use the 'generate-transaction' tool for NEAR to complete the transaction.
          Simply retrieving the payload is not enough—users must execute the transaction via the corresponding tool.
          When dealing with $ROASTI amounts, keep in mind that the token has 24 decimals.
          When inputting a figure parameter, ensure they available in the /api/tools/get-figures endpoint. Format as an enum variant with no spaces or punctuation.
          When inputting a roast style parameter, ensure it is available in the /api/tools/get-styles endpoint. Format as an enum variant with no spaces or punctuation.
          When asked to view leaderboards, use /api/tools/get-leaderboard-by-wins and /api/tools/get-leaderboard-by-damage
          When calling /api/tools/create-duel, the minimum stake is 1 $ROASTI (with 24 decimals).
          Large datasets should be formatted as tables for readability.
        `,
        categories: [
          "memecoin",
          "twitter",
          "history",
          "roasts",
          "memes",
          "games",
        ],
        tools: [{ type: "generate-transaction" }],
      },
    },
    paths: {
      "/api/tools/create-duel": {
        post: {
          operationId: "create-duel",
          summary: "Initiate a duel",
          description:
            "Starts a new duel by selecting a historical figure and staking $ROASTI.",
          parameters: [
            {
              name: "figure",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The historical figure chosen by the player.",
            },
            {
              name: "stake",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description:
                "The amount of $ROASTI staked for the duel (minimum 1 $ROASTI).",
            },
          ],
          responses: {
            "200": { description: "Duel created successfully." },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/accept-duel": {
        post: {
          operationId: "accept-duel",
          summary: "Join an existing duel",
          description:
            "A second player joins a duel by selecting a figure and matching the stake.",
          parameters: [
            {
              name: "duelId",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The ID of the duel to accept.",
            },
            {
              name: "figure",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The historical figure chosen by the second player.",
            },
          ],
          responses: {
            "200": { description: "Duel accepted successfully." },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/take-turn": {
        post: {
          operationId: "take-turn",
          summary: "Perform a roast attack",
          description: "The active player attacks using a chosen roast style.",
          parameters: [
            {
              name: "duelId",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The ID of the duel in progress.",
            },
            {
              name: "style",
              in: "query",
              required: true,
              schema: {
                type: "string",
                enum: ["Witty", "Brutal", "Strategic", "Mocking"],
              },
              description: "The type of roast attack chosen for the turn.",
            },
          ],
          responses: {
            "200": { description: "Turn processed successfully." },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/cancel-duel": {
        post: {
          operationId: "cancel-duel",
          summary: "Cancel an inactive duel",
          description:
            "Cancels a duel if unaccepted for 24h or inactive for 48h.",
          parameters: [
            {
              name: "duelId",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The ID of the duel to cancel.",
            },
          ],
          responses: {
            "200": { description: "Duel canceled successfully." },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-figures": {
        get: {
          operationId: "get-figures",
          summary: "Fetch available historical figures",
          description:
            "Returns a list of all historical figures that can be selected for duels, including their stats.",
          responses: {
            "200": {
              description: "Successful response with historical figures",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      figures: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              description: "The name of the historical figure.",
                            },
                            wit: {
                              type: "integer",
                              description: "Stat for Witty roasts.",
                            },
                            brutality: {
                              type: "integer",
                              description: "Stat for Brutal roasts.",
                            },
                            strategy: {
                              type: "integer",
                              description: "Stat for Strategic roasts.",
                            },
                            mockery: {
                              type: "integer",
                              description: "Stat for Mocking roasts.",
                            },
                          },
                          required: [
                            "name",
                            "wit",
                            "brutality",
                            "strategy",
                            "mockery",
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-styles": {
        get: {
          operationId: "get-styles",
          summary: "Fetch available roast styles",
          description:
            "Returns a list of all roast styles that can be used in duels.",
          responses: {
            "200": {
              description: "Successful response with historical figures",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      styles: {
                        type: "string",
                        description: "The roast style classification.",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-duel": {
        get: {
          operationId: "get-duel",
          summary: "Retrieve duel",
          description: "Fetch a duel by ID.",
          parameters: [
            {
              name: "duelId",
              in: "query",
              required: true,
              schema: { type: "integer" },
              description: "The ID of the duel to retrieve.",
            },
          ],
          responses: {
            "200": {
              description: "Duel retrieved successfully.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "Unique identifier for the duel.",
                      },
                      creation_time: {
                        type: "integer",
                        description: "Timestamp of when the duel was created.",
                      },
                      start_time: {
                        type: "integer",
                        nullable: true,
                        description:
                          "Timestamp of when the duel started (null if not started).",
                      },
                      stake: {
                        type: "string",
                        description: "Amount of $ROASTI staked for the duel.",
                      },
                      player_a: {
                        type: "string",
                        description:
                          "NEAR account ID of the first player (duel initiator).",
                      },
                      figure_a: {
                        type: "string",
                        description: "Historical figure chosen by player A.",
                      },
                      player_b: {
                        type: "string",
                        nullable: true,
                        description:
                          "NEAR account ID of the second player (null if not accepted).",
                      },
                      figure_b: {
                        type: "string",
                        nullable: true,
                        description:
                          "Historical figure chosen by player B (null if not accepted).",
                      },
                      turns: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            creation_time: {
                              type: "integer",
                              description:
                                "Timestamp of when the turn was taken.",
                            },
                            damage: {
                              type: "integer",
                              minimum: 1,
                              maximum: 15,
                              description:
                                "Amount of damage dealt in this turn.",
                            },
                            style: {
                              type: "string",
                              enum: ["Witty", "Brutal", "Strategic", "Mocking"],
                              description:
                                "The style of roast attack used in the duel.",
                            },
                            roast: {
                              type: "string",
                              nullable: true,
                              description:
                                "The AI-generated roast statement (null if not generated).",
                            },
                          },
                        },
                        description: "List of turns taken in the duel.",
                      },
                      winner: {
                        type: "string",
                        nullable: true,
                        enum: ["PlayerA", "PlayerB", "Draw"],
                        description:
                          "The result of the duel (who won or if it was a draw).",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-finished-duels": {
        get: {
          operationId: "get-finished-duels",
          summary: "Retrieve completed duels",
          description:
            "Fetches a list of duels that have been completed (i.e., where there is a winner).",
          parameters: [
            {
              name: "count",
              in: "query",
              required: false,
              schema: { type: "integer", default: 10 },
              description: "The number of finished duels to retrieve.",
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0 },
              description: "Offset for pagination.",
            },
          ],
          responses: {
            "200": {
              description: "List of completed duels.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          description: "Unique identifier for the duel.",
                        },
                        creation_time: {
                          type: "integer",
                          description:
                            "Timestamp of when the duel was created.",
                        },
                        start_time: {
                          type: "integer",
                          nullable: true,
                          description:
                            "Timestamp of when the duel started (null if not started).",
                        },
                        stake: {
                          type: "string",
                          description: "Amount of $ROASTI staked for the duel.",
                        },
                        player_a: {
                          type: "string",
                          description:
                            "NEAR account ID of the first player (duel initiator).",
                        },
                        figure_a: {
                          type: "string",
                          description: "Historical figure chosen by player A.",
                        },
                        player_b: {
                          type: "string",
                          nullable: true,
                          description:
                            "NEAR account ID of the second player (null if not accepted).",
                        },
                        figure_b: {
                          type: "string",
                          nullable: true,
                          description:
                            "Historical figure chosen by player B (null if not accepted).",
                        },
                        winner: {
                          type: "string",
                          nullable: true,
                          enum: ["PlayerA", "PlayerB", "Draw"],
                          description:
                            "The result of the duel (who won or if it was a draw).",
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-active-duels": {
        get: {
          operationId: "get-active-duels",
          summary: "Retrieve ongoing duels",
          description:
            "Fetches a list of duels that are currently in progress (both players have joined, but no winner yet).",
          parameters: [
            {
              name: "count",
              in: "query",
              required: false,
              schema: { type: "integer", default: 10 },
              description: "The number of active duels to retrieve.",
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0 },
              description: "Offset for pagination.",
            },
          ],
          responses: {
            "200": {
              description: "List of active duels.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          description: "Unique identifier for the duel.",
                        },
                        creation_time: {
                          type: "integer",
                          description:
                            "Timestamp of when the duel was created.",
                        },
                        start_time: {
                          type: "integer",
                          nullable: true,
                          description:
                            "Timestamp of when the duel started (null if not started).",
                        },
                        stake: {
                          type: "string",
                          description: "Amount of $ROASTI staked for the duel.",
                        },
                        player_a: {
                          type: "string",
                          description:
                            "NEAR account ID of the first player (duel initiator).",
                        },
                        figure_a: {
                          type: "string",
                          description: "Historical figure chosen by player A.",
                        },
                        player_b: {
                          type: "string",
                          nullable: true,
                          description:
                            "NEAR account ID of the second player (null if not accepted).",
                        },
                        figure_b: {
                          type: "string",
                          nullable: true,
                          description:
                            "Historical figure chosen by player B (null if not accepted).",
                        },
                        winner: {
                          type: "string",
                          nullable: true,
                          enum: ["PlayerA", "PlayerB", "Draw"],
                          description:
                            "The result of the duel (who won or if it was a draw).",
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-pending-duels": {
        get: {
          operationId: "get-pending-duels",
          summary: "Retrieve pending duels",
          description:
            "Fetches a list of duels that have been created but not yet accepted.",
          parameters: [
            {
              name: "count",
              in: "query",
              required: false,
              schema: { type: "integer", default: 10 },
              description: "The number of finished duels to retrieve.",
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0 },
              description: "Offset for pagination.",
            },
          ],
          responses: {
            "200": {
              description: "List of pending duels.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          description: "Unique identifier for the duel.",
                        },
                        creation_time: {
                          type: "integer",
                          description:
                            "Timestamp of when the duel was created.",
                        },
                        start_time: {
                          type: "integer",
                          nullable: true,
                          description:
                            "Timestamp of when the duel started (null if not started).",
                        },
                        stake: {
                          type: "string",
                          description: "Amount of $ROASTI staked for the duel.",
                        },
                        player_a: {
                          type: "string",
                          description:
                            "NEAR account ID of the first player (duel initiator).",
                        },
                        figure_a: {
                          type: "string",
                          description: "Historical figure chosen by player A.",
                        },
                        player_b: {
                          type: "string",
                          nullable: true,
                          description:
                            "NEAR account ID of the second player (null if not accepted).",
                        },
                        figure_b: {
                          type: "string",
                          nullable: true,
                          description:
                            "Historical figure chosen by player B (null if not accepted).",
                        },
                        winner: {
                          type: "string",
                          nullable: true,
                          enum: ["PlayerA", "PlayerB", "Draw"],
                          description:
                            "The result of the duel (who won or if it was a draw).",
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-account-duels": {
        get: {
          operationId: "get-account-duels",
          summary: "Retrieve duel history for a specific player",
          description: "Fetches all duels involving a given account.",
          parameters: [
            {
              name: "accountId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "The NEAR account ID of the player.",
            },
          ],
          responses: {
            "200": {
              description: "List of duels involving the specified player.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          description: "Unique identifier for the duel.",
                        },
                        creation_time: {
                          type: "integer",
                          description:
                            "Timestamp of when the duel was created.",
                        },
                        start_time: {
                          type: "integer",
                          nullable: true,
                          description:
                            "Timestamp of when the duel started (null if not started).",
                        },
                        stake: {
                          type: "string",
                          description: "Amount of $ROASTI staked for the duel.",
                        },
                        player_a: {
                          type: "string",
                          description:
                            "NEAR account ID of the first player (duel initiator).",
                        },
                        figure_a: {
                          type: "string",
                          description: "Historical figure chosen by player A.",
                        },
                        player_b: {
                          type: "string",
                          nullable: true,
                          description:
                            "NEAR account ID of the second player (null if not accepted).",
                        },
                        figure_b: {
                          type: "string",
                          nullable: true,
                          description:
                            "Historical figure chosen by player B (null if not accepted).",
                        },
                        winner: {
                          type: "string",
                          nullable: true,
                          enum: ["PlayerA", "PlayerB", "Draw"],
                          description:
                            "The result of the duel (who won or if it was a draw).",
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-leaderboard-by-wins": {
        get: {
          operationId: "get-leaderboard-by-wins",
          summary: "Leaderboard of top players by total wins",
          description:
            "Returns the top players ranked by the number of duels won.",
          parameters: [
            {
              name: "count",
              in: "query",
              required: false,
              schema: { type: "integer", default: 10 },
              description: "The number of top players to retrieve.",
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0 },
              description: "Offset for pagination.",
            },
          ],
          responses: {
            "200": {
              description: "Leaderboard of top players by wins.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        account_id: {
                          type: "string",
                          description: "Player's NEAR account ID.",
                        },
                        value: {
                          type: "integer",
                          description: "Total number of duels won.",
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-leaderboard-by-damage": {
        get: {
          operationId: "get-leaderboard-by-damage",
          summary: "Leaderboard of top players by total damage dealt",
          description:
            "Returns the top players ranked by the total damage dealt in all duels.",
          parameters: [
            {
              name: "count",
              in: "query",
              required: false,
              schema: { type: "integer", default: 10 },
              description: "The number of top players to retrieve.",
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0 },
              description: "Offset for pagination.",
            },
          ],
          responses: {
            "200": {
              description: "Leaderboard of top players by damage dealt.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        account_id: {
                          type: "string",
                          description: "Player's NEAR account ID.",
                        },
                        value: {
                          type: "integer",
                          description: "Total damage dealt by the player.",
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/transfer-coin": {
        post: {
          operationId: "transfer-coin",
          summary: "Transfer $ROASTI tokens",
          description:
            "Transfers $ROASTI tokens from the sender to another NEAR account.",
          parameters: [
            {
              name: "receiverId",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "NEAR account ID of the recipient.",
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "Amount of $ROASTI to transfer.",
            },
            {
              name: "memo",
              in: "query",
              required: false,
              schema: {
                type: "string",
              },
              description: "Optional memo attached to transfer.",
            },
          ],
          responses: {
            "200": { description: "Transfer successful" },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/burn-coin": {
        post: {
          operationId: "burn-coin",
          summary: "Burn $ROASTI tokens",
          description:
            "Permanently removes a specified amount of $ROASTI from circulation.",
          parameters: [
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The amount of $ROASTI to burn.",
            },
          ],
          responses: {
            "200": { description: "Tokens burned successfully" },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-balance": {
        get: {
          operationId: "get-balance",
          summary: "Check $ROASTI balance",
          description:
            "Retrieves the $ROASTI token balance of a specified NEAR account.",
          parameters: [
            {
              name: "accountId",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The NEAR account ID to check balance for.",
            },
          ],
          responses: {
            "200": {
              description: "Successful balance retrieval",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      balance: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/get-total-supply": {
        get: {
          operationId: "get-total-supply",
          summary: "Retrieve total $ROASTI supply",
          description: "Returns the total supply of $ROASTI tokens.",
          responses: {
            "200": {
              description: "Total $ROASTI supply retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      totalSupply: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request or missing parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message.",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(pluginData);
}
