Use Chat

DECLARE @publicKey nvarchar(392)
DECLARE @date DATETIME

SET @publicKey = '${publicKey}'
SET @date = GETDATE()

INSERT INTO Person (id, publicKey, lastSeen, isAllowed)
SELECT NEWID(), @publicKey, @date, 1
WHERE NOT EXISTS (SELECT 1 FROM Person WHERE publicKey = @publicKey);

UPDATE Person
SET lastSeen = @date
WHERE NOT EXISTS(Select 1 FROM Person WHERE publicKey = @publicKey AND lastSeen = @date)

SELECT * FROM Person WHERE publicKey = @publicKey;