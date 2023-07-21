Use Chat
DECLARE @roomId uniqueidentifier
DECLARE @personId uniqueidentifier
DECLARE @roomName nvarchar(50)
DECLARE @publicKey nvarchar(450)

SET @roomName = '${room}'
SET @publicKey = '${publicKey}'

SET @personId = (SELECT id FROM Person WHERE publicKey = @publicKey)

IF NOT EXISTS (SELECT 1 FROM Rooms WHERE room = @roomName)
BEGIN
	INSERT INTO Rooms(id, room, admin)
	VALUES (NEWID(), @roomName, @personId)

	SET @roomId = (SELECT id FROM Rooms WHERE room = @roomName)

	INSERT INTO PersonRooms (roomId, personId, accessGranted)
	VALUES (@roomId, @personId, 1)
END

SELECT CASE WHEN EXISTS (SELECT * FROM PersonRooms WHERE roomId = @roomId AND personId = @personId AND accessGranted = 1)
THEN CAST(1 AS BIT)
ELSE CAST(0 AS BIT)
END AS [createdRoom];