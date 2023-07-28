require("dotenv").config();
const crypto = require("node:crypto");

const fs = require("fs");
const _ = require("lodash");
const { Socket, Server } = require("socket.io");

const masterServerPort = process.env.MASTER_SERVER_PORT;
const secretKey = process.env.SECRET_KEY;
const token = process.env.AUTH_TOKEN;
const privateKey = fs.readFileSync("ignore/private-key.pem");
const publicKey = fs.readFileSync("ignore/public-key.pem");

const encryption = require("./encryption");
const queryHandler = require("./queryHandler");
queryHandler.connect();

process.on("SIGINT", () => {
  console.log("Closing server");
  queryHandler.closePools();
  io.close();
});

const query = require("./sql_server");
const {
  INVALID_TOKEN_VALIDATION,
  INVALID_TOKEN_VALIDATION_DESCRIPTION,
  INVALID_CREDENTIALS,
  INVALID_CREDENTIALS_DESCRIPTION,
  INVALID_PUBLICKEY,
  INVALID_PUBLICKEY_DESCRIPTION,
  PERSON_NOT_ALLOWED,
  PERSON_NOT_ALLOWED_DESCRIPTION
} = require("./constants/errors");

/**
 * @type {{ 
 *     id: String, 
 *     publicKey: string | crypto.KeyObject | Buffer | crypto.PublicKeyInput | crypto.JsonWebKeyInput, 
 *     publicValidationCode: Buffer, 
 *     rooms: String[], 
 *     adminRooms: String[],
 *     awaitingApprovalRooms,
 *     lastSeen: Date,
 * }[]}
 */
let connectedUsers = [];
const io = new Server(masterServerPort);

io.use((socket, next) => middleware(socket, next));

/**
 * @param {Socket} socket 
 * @param {Function} next
 */
const middleware = async (socket, next) => {
  const authToken = socket.handshake.auth.token;
  if (authToken === token) {
    console.log("Authentication successful");
    return next();
  } else {
    console.log("Authentication failed");
    await queryHandler.executeQuery(query.insertEventQuery, { ipAddress: socket.handshake.address, publicKey, eventType: INVALID_CREDENTIALS, eventDescription: INVALID_CREDENTIALS_DESCRIPTION });
    return next(new Error("Authentication failed"));
  }
};

io.on("connection", (/** @type {Socket} */ socket) => onConnect(socket));

/**
 * @param {Socket} socket 
 */
const onConnect = ((socket) => {
  console.log("A client connected:", socket.id);

  socket.on("disconnect", () => disconnect(socket));

  socket.on("requestToken", (publicKey) => requestToken(socket, publicKey));
})

/**
 * @param {Socket} socket 
 * @param {string | Buffer | crypto.KeyObject | crypto.PublicKeyInput | crypto.JsonWebKeyInput} publicKey 
 * @returns 
 */

const requestToken = async (socket, publicKey) => {
  if (_.isNil(publicKey) || !encryption.isValidRSAPublicKey(publicKey)) {
    console.log("Not a valid RSA Public Key");
    await queryHandler.executeQuery(query.insertEventQuery, { ipAddress: socket.handshake.address, publicKey, INVALID_PUBLICKEY, INVALID_PUBLICKEY_DESCRIPTION });
    socket.disconnect();
    return;
  }

  const { lastSeen, isAllowed } = (await queryHandler.executeQuery(query.getCreatePersonQuery, { publicKey }))[0];

  if (!isAllowed) {
    console.log("Person is not allowed");
    await queryHandler.executeQuery(query.insertEventQuery, { ipAddress: socket.handshake.address, publicKey, PERSON_NOT_ALLOWED, PERSON_NOT_ALLOWED_DESCRIPTION });
    socket.disconnect();
    return;
  }

  const payload = { client: socket.id };
  const jwt = encryption.createToken(payload, secretKey);
  const jwtToken = encryption.encryptWithPrivateKey(jwt, privateKey);
  const publicValidationCode = crypto.randomBytes(16);

  connectedUsers.push({ id: socket.id, publicKey, publicValidationCode, rooms: [], adminRooms: [], awaitingApprovalRooms: [], lastSeen });

  const validator = crypto.publicEncrypt(publicKey, publicValidationCode);
  socket.emit("token", { jwtToken, validator });

  socket.on("validate", ({ validated }) => validate(socket, validated));
};

/** 
 * @param {Socket} socket  
 * @param {Buffer} validated
*/
const validate = async (socket, validated) => {
  // Make sure validated is of type Buffer
  if (!Buffer.isBuffer(validated) && validated.length !== 16) {
    console.log("Validation failed. Not a Buffer or length is not 16");
    await queryHandler.executeQuery(query.insertEventQuery, { ipAddress: socket.handshake.address, publicKey, eventType: INVALID_TOKEN_VALIDATION, eventDescription: INVALID_TOKEN_VALIDATION_DESCRIPTION });
    socket.disconnect();
    return;
  }

  const userData = connectedUsers.find(
    (obj) => obj.id === socket.id
  );

  if (_.isNil(userData)) {
    console.log("User not found");
    socket.disconnect();
    return;
  }

  if (!_.isEqual(validated, userData.publicValidationCode)) {
    console.log("Invalid validation code");
    await queryHandler.executeQuery(query.insertEventQuery, { ipAddress: socket.handshake.address, publicKey: userData.publicKey, eventType: INVALID_TOKEN_VALIDATION, eventDescription: INVALID_TOKEN_VALIDATION_DESCRIPTION });
    socket.disconnect();
    return;
  }

  userData.rooms = await queryHandler.executeQuery(query.getRoomsUserIsInQuery, { publicKey: userData.publicKey });
  userData.adminRooms = await queryHandler.executeQuery(query.getRoomsWhereUserIsAdminQuery, { publicKey: userData.publicKey });
  userData.awaitingApprovalRooms = await queryHandler.executeQuery(query.adminGetRoomsWherePersonAwaitingApprovalQuery, { publicKey: userData.publicKey });

  console.log("UserData", userData);
  console.log("Validation successful");
  socket.emit("validated");
};

/**
 * @param {Socket} socket 
 */
const disconnect = (socket) => {
  console.log("User disconnected", socket.id);
  var index = connectedUsers.findIndex((obj) => obj.id === socket.id);
  connectedUsers.splice(index, index >= 0 ? 1 : 0);
};

// Exporting functions for testing
module.exports = {
  requestToken,
  validate,
  disconnect,
  setConnectedUsers: (users) => (connectedUsers = users),
  getConnectedUsers: () => connectedUsers,
  disconnectAll: (fn) => io.close(() => fn()),
  middleware,
  onConnect,
};
