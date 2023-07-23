const {
  validate,
  setConnectedUsers,
  requestToken,
  disconnect,
  disconnectAll,
  middleware,
  onConnect,
  getConnectedUsers,
} = require("./server.js");
const _ = require("lodash");

const { generateKeyPairSync } = require("node:crypto");
require("dotenv").config();

const token = process.env.AUTH_TOKEN;

const connectedUsersMock = [
  { id: "socket1", publicValidationCode: "abc123", publicKey: "publicKey1" },
  { id: "socket2", publicValidationCode: "def456", publicKey: "publicKey2" },
];

let socketMock = {
  id: "socket1",
  emit: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  handshake: {
    auth: {
      token: token,
    },
    address: "::1"
  },
};

const nextMock = jest.fn();
console.log = jest.fn();
// Mock the queryHandler module
jest.mock('./queryHandler', () => {
  let isAllowedValue = 1; // Default value for isAllowed

  return {
    setIsAllowed: (value) => {
      isAllowedValue = value;
    },
    executeQuery: jest.fn(() => {
      return [
        { room: 'room1', lastSeen: Date.now(), isAllowed: isAllowedValue },
      ];
    }),
    connect: jest.fn(),
    closePools: jest.fn(),
  }
});

jest.mock('./sql_server', () => {
  return {
    getRoomsWhereUserIsAdmin: jest.fn(),
    getAllPerson: jest.fn(),
    adminApproveJoinRequestToRoom: jest.fn(),
    adminRejectJoinRequestToRoom: jest.fn(),
    adminGetRoomsWherePersonAwaitingApproval: jest.fn(),
    getAllPersonsInRoom: jest.fn(),
    requestToJoinRoom: jest.fn(),
    createTables: jest.fn(),
    createRoom: jest.fn(),
    getRoomsUserIsIn: jest.fn(),
    insertEvent: jest.fn(),
    getCreatePerson: jest.fn(),
  }
});
beforeEach((done) => {
  socketMock = {
    id: "socket1",
    emit: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    handshake: {
      auth: {
        token: token,
      },
      address: "::1"
    },
  };
  setConnectedUsers([{ id: "socket1", publicValidationCode: "abc123", publicKey: "publicKey1" },
    { id: "socket2", publicValidationCode: "def456", publicKey: "publicKey2" },]);
  done();
});

afterAll((done) => {
  disconnectAll(() => done());
});

test("validate should emit 'validated' event when validation is successful", async () => {
  const validated = "abc123";
  
  await validate(socketMock, validated);

  expect(socketMock.emit).toHaveBeenCalledWith("validated");
  expect(socketMock.disconnect).not.toHaveBeenCalled();
});

test("validate should disconnect user when user is not found", async () => {
  const validated = "abc123";
  const socketMock = {
    id: "j",
    disconnect: jest.fn(),
  };

  await validate(socketMock, validated);

  expect(console.log).toHaveBeenCalledWith("User not found");
  expect(socketMock.disconnect).toHaveBeenCalled();
});

test("validate should disconnect socket and not emit 'validated' event when validation fails", async () => {
  const validated = "invalidCode";

  await validate(socketMock, validated);

  expect(socketMock.disconnect).toHaveBeenCalled();
  expect(socketMock.emit).not.toHaveBeenCalled();
});

test("disconnected user should be removed from connectedUsers", () => {
  disconnect(socketMock);
  const connectedUsers = getConnectedUsers();

  expect(connectedUsers).toHaveLength(1);
  expect(connectedUsers[0].id).toBe("socket2");
});

test("disconnected user should not be removed from connectedUsers when user is not found", () => {
  const socketMock = {
    id: "j"
  };

  disconnect(socketMock);

  expect(getConnectedUsers()).toHaveLength(2);
});

test("requestToken should disconnect user when user is not allowed", async () => {
  const { publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const publicKeyPEM = publicKey.export({ type: "pkcs1", format: "pem" });
  const queryHandlerMock = require('./queryHandler');
  queryHandlerMock.setIsAllowed(0);

  await requestToken(socketMock, publicKeyPEM);

  expect(console.log).toHaveBeenCalledWith("Person is not allowed");
  expect(socketMock.disconnect).toHaveBeenCalled();
});

test("requestToken should disconnect socket when publicKey is not valid", async () => {
  await requestToken(socketMock, "invalidPublicKey");

  expect(socketMock.disconnect).toHaveBeenCalled();
  expect(socketMock.emit).not.toHaveBeenCalled();
});

test("requestToken should not disconnect socket when publicKey is valid", async () => {
  const { publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const publicKeyPEM = publicKey.export({ type: "pkcs1", format: "pem" });
  const queryHandlerMock = require('./queryHandler');
  queryHandlerMock.setIsAllowed(1);

  await requestToken(socketMock, publicKeyPEM);

  expect(console.log).not.toHaveBeenCalledWith("Person is not allowed");
  expect(socketMock.disconnect).not.toHaveBeenCalled();
  expect(socketMock.emit).toHaveBeenCalled();
  expect(socketMock.on).toHaveBeenCalledWith("validate", expect.any(Function));
});

test("requestToken should disconnect socket when invalid token is sent", async () => {
  await requestToken(socketMock, "publicKeyPEM");

  expect(socketMock.disconnect).toHaveBeenCalled();
});

test("should authenticate successfully", () => {
  middleware(socketMock, nextMock);

  expect(console.log).toHaveBeenCalledWith("Authentication successful");
  expect(nextMock).toHaveBeenCalled();
});

test("should not authenticate successfully", async () => {
  const socketMock = {
    id: "socket1",
    emit: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    handshake: {
      auth: {
        token: 'token',
      },
      address: "::1"
    },
  };

  await middleware(socketMock, nextMock);

  expect(console.log).toHaveBeenCalledWith("Authentication failed");
  expect(nextMock).toHaveBeenCalledWith(new Error("Authentication failed"));
});

test("onConnect should call on 'disconnect' and 'requestToken' events", () => {
  onConnect(socketMock);

  expect(socketMock.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
  expect(socketMock.on).toHaveBeenCalledWith("requestToken", expect.any(Function));
});

test('should close the server and call closePools and io.close', () => {
  const queryHandler = require('./queryHandler');
  
  // Simulate SIGINT event by manually calling the handler
  process.emit('SIGINT');

  // Expectations
  expect(console.log).toHaveBeenCalledWith('Closing server');
  expect(console.log).toHaveBeenCalledTimes(1);

  expect(queryHandler.closePools).toHaveBeenCalled();
});
