require("dotenv").config();
const crypto = require("node:crypto");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

/**
 * @param { String } message
 */
const encryptMessage = (message) => {
  const sessionKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", sessionKey, iv);
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
    const decipher = crypto.createDecipheriv("aes-256-cbc", sessionKey, receivedIV);
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
  return crypto.privateEncrypt(privateKey, data);
}

/**
 * @param { WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer> } encryptedMessageWithIV
 * @param { crypto.RsaPrivateKey | crypto.KeyLike } privateKey
 * @param { NoedeJs.ArrayBufferView } publicEncryptedSession
 */
const decryptPublicMessage = (
  encryptedMessageWithIV,
  privateKey,
  publicEncryptedSession
) => {
  const sessionKey = crypto.privateDecrypt(privateKey, publicEncryptedSession);

  return decryptMessage(encryptedMessageWithIV, sessionKey);
};

/**
 * @param { String } message
 * @param { { publicKey: crypto.RsaPrivateKey | crypto.KeyLike | crypto.RsaPublicKey, id: String }[] } publicKeysWithID
 */
const encryptPublicMessage = (message, publicKeysWithID, privateKey) => {
  const { sessionKey, encryptedMessageWithIV } = encryptMessage(message);

  /**
   * @type { { encryptedSessionKey: Buffer, id: String, signature: Buffer }[] }
   */
  const packets = [];

  publicKeysWithID.forEach((publicKeyId) => {
    const { publicKey, id } = publicKeyId;
    const encryptedSessionKey = crypto.publicEncrypt(publicKey, sessionKey);
    const signature = crypto.sign("RSA-SHA256", encryptedSessionKey, privateKey);
    packets.push({ encryptedSessionKey, id, signature });
  });

  return { packets, encryptedMessageWithIV };
};

/**
 * @param { String | crypto.KeyObject | Buffer | crypto.PublicKeyInput | crypto.JsonWebKeyInput } publicKey
 * */
const isValidRSAPublicKey = (publicKey) => {
  try {
    crypto.createPublicKey(publicKey);
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
