USE Chat

DECLARE @roomId uniqueidentifier
DECLARE @personId uniqueidentifier
SET @roomId = (SELECT id FROM Rooms WHERE room = '${room}')
SET @personId = (SELECT id FROM Person WHERE publicKey = '${publicKey}')

IF NOT EXISTS (SELECT 1 FROM PersonRooms WHERE personId = @personId AND roomId = @roomId)
BEGIN
    INSERT INTO PersonRooms (personId, roomId, accessGranted)
    VALUES (@personId, @roomId, 0)
END

SELECT CASE WHEN EXISTS (SELECT * FROM PersonRooms WHERE roomId = @roomId AND personId = @personId AND accessGranted = 0)
THEN CAST(1 AS BIT)
ELSE CAST(0 AS BIT)
END AS [requestSent];