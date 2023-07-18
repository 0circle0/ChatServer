const {
  publicEncrypt,
  generateKeyPairSync,
  verify,
  publicDecrypt,
} = require("node:crypto");

const {
  encryptWithPrivateKey,
  encryptMessage,
  decryptMessage,
  encryptPublicMessage,
  isValidRSAPublicKey,
  decryptPublicMessage,
  createToken,
  isValidToken,
} = require("./encryption");

const jwt = require("jsonwebtoken");

describe("encryptsNullMessage", () => {
  const message = null;
  it("encrypts empty message", () => {
    const {sessionKey, encryptedMessageWithIV} = encryptMessage(message);
    expect(sessionKey).toBeDefined();
    expect(encryptedMessageWithIV).toBeDefined();
  })
})

describe("decryptMessageCorrectly", () => {
  const message = "Hello, World!";
  const { sessionKey, encryptedMessageWithIV } = encryptMessage(message);
  it("should decrypt the message correctly", () => {
    const decrypted = decryptMessage(encryptedMessageWithIV, sessionKey);
    expect(decrypted).toBe(message);
  });
});

describe("decryptMessageFails", () => {
  it("should fail to decrypt", () => {
    const failed = decryptMessage("test", "test");
    expect(failed).toBeDefined();
    expect(failed.message).toBeDefined();
  })
})

describe("encryptMessageCorrectly", () => {
  const message = "Hello, World!";

  it("should encrypt the message correctly", () => {
    const { sessionKey, encryptedMessageWithIV } = encryptMessage(message);
    expect(sessionKey).toHaveLength(32);
    expect(encryptedMessageWithIV).toHaveLength(64);
  });
});

describe("encryptWithPrivateKey", () => {
  const message = "Hello, World!";
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const privateKeyPEM = privateKey.export({ type: "pkcs1", format: "pem" });
  const publicKeyPEM = publicKey.export({ type: "pkcs1", format: "pem" });
  it("should encrypt the message correctly", () => {
    const encrypted = encryptWithPrivateKey(message, privateKeyPEM);
    expect(encrypted).toBeDefined();
    //expect publicDectypt to not throw an error
    let decrypted;
    expect(() => decrypted = publicDecrypt(publicKeyPEM, encrypted)).not.toThrow();
    expect(decrypted.toString()).toBe(message);
  });
});

describe("decryptPublicMessage", () => {
  const { sessionKey, encryptedMessageWithIV } =
    encryptMessage("This is a message");
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const privateKeyPEM = privateKey.export({ type: "pkcs1", format: "pem" });
  const publicKeyPEM = publicKey.export({ type: "pkcs1", format: "pem" });
  const publicEncryptedSession = publicEncrypt(publicKeyPEM, sessionKey);

  it("should decrypt the message correctly with keypair", () => {
    const decryptedMessage = decryptPublicMessage(
      encryptedMessageWithIV,
      privateKeyPEM,
      publicEncryptedSession
    );
    expect(decryptedMessage).toBe("This is a message");
  });
});

describe("encryptPublicMessage", () => {
  const publicKeysWithID = [];
  const { privateKey, publicKey: myPublicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const myPrivateKey = privateKey.export({ type: "pkcs1", format: "pem" });
  const myPublicKeyPEM = myPublicKey.export({ type: "pkcs1", format: "pem" });
  for (let i = 0; i < 3; i++) {
    const { publicKey, privateKey: pk } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const publicKeyPEM = publicKey.export({ type: "pkcs1", format: "pem" });
    
    publicKeysWithID.push({ id: i, publicKey: publicKeyPEM, privateKey: pk });
  }
  const message = "Hello, World!";
  it("returns Packets", () => {
    const {packets, encryptedMessageWithIV} = encryptPublicMessage(message, publicKeysWithID, myPrivateKey);
    
    expect(packets).toHaveLength(3);
    packets.forEach((packet) => {
      const verifySignedPacket = verify(
        "rsa-sha256",
        packet.encryptedSessionKey,
        myPublicKeyPEM,
        packet.signature
      );
      expect(verifySignedPacket).toBe(true);
      expect(encryptedMessageWithIV).toHaveLength(64);
      expect(packet.encryptedSessionKey).toHaveLength(256);
      expect(packet.id).toBeDefined();
    });
  });
});

describe("isValidRSAPublicKey returns true", () => {
  const { publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const publicKeyPEM = publicKey.export({ type: "pkcs1", format: "pem" });
  it("valid RSA public Key", () => {
    const validPublicKey = isValidRSAPublicKey(publicKeyPEM);
    expect(validPublicKey).toBe(true);
  });
});

describe("isValidRSAPublicKey returns false", () => {
  it("invalid RSA Public Key", () => {
    const invalidRSA = isValidRSAPublicKey("123");
    expect(invalidRSA).toBe(false);
  })
})

describe("createsValidJWT", () => {
  const secretKey = process.env.SECRET_KEY;
  it("creates valid JWT", () => {
    const token = createToken({data: "test"}, secretKey);
    expect(token).toBeDefined();
  });
});

describe("isValidToken returns true", () => {
  const secretKey = process.env.SECRET_KEY;
  const token = createToken({data: "test"}, secretKey);
  it("valid token", () => {
    const validToken = isValidToken(token, secretKey);
    expect(validToken.decoded).toBeDefined();
  });
});

describe("isValidToken returns false", () => {
  const secretKey = process.env.SECRET_KEY;
  const token = createToken({data: "test"}, secretKey);
  it("invalid token", () => {
    const validToken = isValidToken(token, "123");
    expect(validToken.decoded).toBe(undefined);
  });
});
