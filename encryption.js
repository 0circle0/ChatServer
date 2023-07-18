require("dotenv").config();
const {
  randomBytes,
  publicEncrypt,
  createCipheriv,
  createDecipheriv,
  createPublicKey,
  privateDecrypt,
  privateEncrypt,
  RsaPrivateKey,
  KeyLike,
  KeyObject,
  PublicKeyInput,
  JsonWebKeyInput,
  sign,
} = require("node:crypto");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

/**
 * @param {String} message
 */
const encryptMessage = (message) => {
  const sessionKey = randomBytes(32);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", sessionKey, iv);
  let encrypted = cipher.update(_.isNil(message) ? "" : message, "utf8", "hex");
  encrypted += cipher.final("hex");
  const ivHex = iv.toString("hex");
  const encryptedMessageWithIV = ivHex + encrypted;

  return { sessionKey, encryptedMessageWithIV };
};

const decryptMessage = (encryptedMessageWithIV, sessionKey) => {
  const receivedIV = Buffer.from(encryptedMessageWithIV.slice(0, 32), "hex");

  // Recipient creates decipher using session key and received IV for decryption
  let decrypted;
  try {
    const decipher = createDecipheriv("aes-256-cbc", sessionKey, receivedIV);
    decrypted = decipher.update(
      encryptedMessageWithIV.slice(32),
      "hex",
      "utf8"
    );
    decrypted += decipher.final("utf8");
  } catch (err) {
    return err;
  }
  return decrypted;
};

const encryptWithPrivateKey = (data, privateKey) => {
  return privateEncrypt(privateKey, data);
}

/**
 * @param {WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>} encryptedMessageWithIV
 * @param {RsaPrivateKey | KeyLike} privateKey
 * @param {NoedeJs.ArrayBufferView} publicEncryptedSession
 */
const decryptPublicMessage = (
  encryptedMessageWithIV,
  privateKey,
  publicEncryptedSession
) => {
  const sessionKey = privateDecrypt(privateKey, publicEncryptedSession);

  return decryptMessage(encryptedMessageWithIV, sessionKey);
};

/**
 * @param {String} message
 * @param {{publicKey: RsaPrivateKey | KeyLike | RsaPublicKey, id: String}[]} publicKeysWithID
 */
const encryptPublicMessage = (message, publicKeysWithID, privateKey) => {
  const { sessionKey, encryptedMessageWithIV } = encryptMessage(message);

  /**
   * @type {{encryptedSessionKey: Buffer, id: String, signature: Buffer}[]}
   */
  const packets = [];

  publicKeysWithID.forEach((publicKeyId) => {
    const { publicKey, id } = publicKeyId;
    const encryptedSessionKey = publicEncrypt(publicKey, sessionKey);
    const signature = sign("RSA-SHA256", encryptedSessionKey, privateKey);
    packets.push({ encryptedSessionKey, id, signature });
  });

  return {packets, encryptedMessageWithIV};
};

/**
 * @param {string | KeyObject | Buffer | PublicKeyInput | JsonWebKeyInput} publicKey
 * */
const isValidRSAPublicKey = (publicKey) => {
  try {
    createPublicKey(publicKey);
    return true;
  } catch (err) {
    return false;
  }
};

const createToken = (payload, secretKey) => {
  return jwt.sign(payload, secretKey);
}

const isValidToken = (token, secretKey) => {
  return jwt.verify(token, secretKey, (err, decoded) => {
    if (err !== null) {
      console.log(err.name, err.message);
      return { error: err, decoded: undefined }
    }
    return { error: undefined, decoded };
  });
};

module.exports = {
  decryptMessage,
  encryptMessage,
  encryptPublicMessage,
  isValidRSAPublicKey,
  decryptPublicMessage,
  isValidToken,
  createToken,
  encryptWithPrivateKey,
};
