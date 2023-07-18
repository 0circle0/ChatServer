const {
  KeyObject,
  PublicKeyInput,
  JsonWebKeyInput,
  publicEncrypt,
  randomBytes,
} = require("node:crypto");

const MongoClient = require("mongodb").MongoClient;
const { ObjectId } = require("mongodb");
require("dotenv").config();
const fs = require("fs");
const url = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;
const dbCollection = process.env.MONGO_DB_COLLECTION;
const masterServerPort = process.env.MASTER_SERVER_PORT;
const secretKey = process.env.SECRET_KEY;
const token = process.env.AUTH_TOKEN;
const privateKey = fs.readFileSync("ignore/private-key.pem");
const publicKey = fs.readFileSync("ignore/public-key.pem");
const _ = require("lodash");
const { Socket } = require("socket.io");
/** @type {Socket} */
const io = require("socket.io")(masterServerPort);
const {
  isValidRSAPublicKey,
  isValidToken,
  createToken,
  encryptWithPrivateKey,
} = require("./encryption");


const executeQuery = require("./queryHandler");
const { getRoomsWhereUserIsAdmin,
  getAllPerson,
  adminApproveJoinRequestToRoom,
  adminRejectJoinRequestToRoom,
  adminGetRoomsWherePersonAwaitingApproval,
  getAllPersonsInRoom,
  requestToJoinRoom,
  createTables
} = require("./sql_server");

executeQuery(getAllPersonsInRoom('123 Room'))
  .then((result) => {
    console.log(result);
  }).catch((err) => {
    console.error(err);
  });


/**
 * @type {{ id: String, publicKey: string | KeyObject | Buffer | PublicKeyInput | JsonWebKeyInput }[]}
 */
let connectedUsers = [];

io.use((socket, next) => middleware(socket, next));

const middleware = (socket, next) => {
  const authToken = socket.handshake.auth.token;
  if (authToken === token) {
    console.log("Authentication successful");
    return next();
  } else {
    console.log("Authentication failed");
    return next(new Error("Authentication failed"));
  }
};

io.on("connection", (/** @type {Socket} */ socket) => onConnect(socket));

const onConnect = ((socket) => {
  console.log("A client connected:", socket.id);

  socket.on("disconnect", () => disconnect(socket));

  socket.on("requestToken", (publicKey) => requestToken(socket, publicKey));
})

const requestToken = (socket, publicKey) => {
  if (_.isNil(publicKey) || !isValidRSAPublicKey(publicKey)) {
    console.log("Not a valid RSA Public Key");
    socket.disconnect();
    return;
  }

  const payload = { client: socket.id };
  const jwt = createToken(payload, secretKey);
  const jwtToken = encryptWithPrivateKey(jwt, privateKey);
  const publicValidationCode = randomBytes(16);

  connectedUsers.push({ id: socket.id, publicKey, publicValidationCode });

  const validator = publicEncrypt(publicKey, publicValidationCode);
  socket.emit("token", { jwtToken, validator });

  socket.on("validate", ({ validated }) => validate(socket, validated));
};

const validate = (socket, validated) => {
  const { publicValidationCode } = connectedUsers.find(
    (obj) => obj.id === socket.id
  );
  if (!_.isEqual(validated, publicValidationCode)) {
    console.log("Invalid validation code");
    socket.disconnect();
    return;
  }

  console.log("Validation successful");
  socket.emit("validated");
};

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
