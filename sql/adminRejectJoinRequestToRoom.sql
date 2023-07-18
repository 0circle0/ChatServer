use Chat
DECLARE @roomId uniqueidentifier
DECLARE @personId uniqueidentifier
DECLARE @roomAdminId uniqueidentifier
DECLARE @roomAdmin bit

SET @roomId = (SELECT id FROM Rooms WHERE room = '${room}')
SET @personId = (SELECT id FROM Person WHERE publicKey = '${approveePublicKey}')
SET @roomAdminId = (SELECT id FROM Person WHERE publicKey = '${approverPublicKey}')
SET @roomAdmin = (SELECT 1 FROM Rooms WHERE admin = @roomAdminId AND id = @roomId)
IF EXISTS (SELECT 1 FROM PersonRooms WHERE roomId = @roomId AND personId = @personId AND accessGranted = 0 AND @roomAdmin = 1)
BEGIN
	DELETE FROM PersonRooms 
	WHERE roomId = @roomId AND personId = @personId
END

SELECT CASE WHEN NOT EXISTS (SELECT * FROM PersonRooms WHERE roomId = @roomId AND personId = @personId)
THEN CAST(1 AS BIT)
ELSE CAST(0 AS BIT)
END AS [deleted];