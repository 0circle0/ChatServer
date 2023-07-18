USE Chat

DECLARE @userId uniqueidentifier

SET @userId = (SELECT id FROM Person WHERE publicKey = '${publicKey}')

SELECT room FROM Rooms WHERE admin = @userId