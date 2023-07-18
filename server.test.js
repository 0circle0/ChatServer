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
  { id: "socket1", publicValidationCode: "abc123" },
  { id: "socket2", publicValidationCode: "def456" },
];

const socketMock = {
  id: "socket1",
  emit: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  handshake: {
    auth: {
      token: token,
    },
  },
};

const nextMock = jest.fn();
console.log = jest.fn();

afterAll((done) => {
  disconnectAll(() => done());
});

test("validate should emit 'validated' event when validation is successful", () => {
  setConnectedUsers(connectedUsersMock);
  const validated = "abc123";

  validate(socketMock, validated);

  expect(socketMock.emit).toHaveBeenCalledWith("validated");
  expect(socketMock.disconnect).not.toHaveBeenCalled();
});

test("validate should disconnect socket and not emit 'validated' event when validation fails", () => {
  setConnectedUsers(connectedUsersMock);
  const validated = "invalidCode";

  validate(socketMock, validated);

  expect(socketMock.disconnect).toHaveBeenCalled();
  expect(socketMock.emit).not.toHaveBeenCalled();
});

test("disconnected user should be removed from connectedUsers", () => {
  setConnectedUsers(connectedUsersMock);
  const socketMock = { id: "socket1" };

  disconnect(socketMock);

  expect(connectedUsersMock).toHaveLength(1);
  expect(connectedUsersMock[0].id).toBe("socket2");
});

test("disconnected user should not be removed from connectedUsers when user is not found", () => {
  setConnectedUsers([
    { id: "socket1", publicValidationCode: "abc123" },
    { id: "socket2", publicValidationCode: "def456" },
  ]);
  const socketMock = { id: "invalidSocket" };

  disconnect(socketMock);

  expect(getConnectedUsers()).toHaveLength(2);
});

test("requestToken should disconnect socket when publicKey is not valid", () => {
  setConnectedUsers(connectedUsersMock);

  const socketMock = {
    id: "socket1",
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  requestToken(socketMock, "invalidPublicKey");

  expect(socketMock.disconnect).toHaveBeenCalled();
  expect(socketMock.emit).not.toHaveBeenCalled();
});

test("requestToken should not disconnect socket when publicKey is valid", () => {
  setConnectedUsers(connectedUsersMock);

  const socketMock = {
    id: "socket1",
    emit: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
  };

  const { publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const publicKeyPEM = publicKey.export({ type: "pkcs1", format: "pem" });

  requestToken(socketMock, publicKeyPEM);

  expect(socketMock.disconnect).not.toHaveBeenCalled();
  expect(socketMock.emit).toHaveBeenCalled();
  expect(socketMock.on).toHaveBeenCalledWith("validate", expect.any(Function));
});

test("requestToken should disconnect socket when invalid token is sent", () => {
  setConnectedUsers(connectedUsersMock);

  const socketMock = {
    id: "socket1",
    emit: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
  };

  requestToken(socketMock, "publicKeyPEM");

  expect(socketMock.disconnect).toHaveBeenCalled();
});

test("should authenticate successfully", () => {
  middleware(socketMock, nextMock);

  expect(console.log).toHaveBeenCalledWith("Authentication successful");
  expect(nextMock).toHaveBeenCalled();
});

test("should not authenticate successfully", () => {
  const socketMock = {
    handshake: {
      auth: {
        token: "InvalidToken",
      },
    },
  };

  middleware(socketMock, nextMock);

  expect(console.log).toHaveBeenCalledWith("Authentication failed");
  expect(nextMock).toHaveBeenCalledWith(new Error("Authentication failed"));
});

test("onConnect should call on 'disconnect' and 'requestToken' events", () => {
  const socketMock = {
    id: "socket1",
    on: jest.fn(),
    handshake: {
      auth: {
        token: token,
      },
    },
  };

  onConnect(socketMock);

  expect(socketMock.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
  expect(socketMock.on).toHaveBeenCalledWith("requestToken", expect.any(Function));
});
