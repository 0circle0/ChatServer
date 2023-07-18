USE Chat

DECLARE @approverId uniqueidentifier
DECLARE @approveeId uniqueidentifier
DECLARE @roomAdminId uniqueidentifier
DECLARE @roomId uniqueidentifier
DECLARE @RoomNeedsApproval bit

SET @approverId = (SELECT id FROM Person WHERE publicKey = '${approverPublicKey}')
SET @approveeId = (SELECT id FROM Person WHERE publicKey = '${approveePublicKey}')
SELECT @roomAdminId = admin, @roomId = id FROM Rooms WHERE room = '${room}'
SET @RoomNeedsApproval = (SELECT 1 FROM PersonRooms WHERE personId = @approveeId AND accessGranted = 0 AND roomId = @roomId)

IF (@roomAdminId = @approverId AND @RoomNeedsApproval = 1)
BEGIN
	UPDATE PersonRooms
	SET accessGranted = 1
	WHERE roomId = @roomId AND personId = @approveeId
END

SELECT CASE WHEN EXISTS (SELECT * FROM PersonRooms WHERE roomId = @roomId AND personId = @approverId AND accessGranted = 1)
THEN CAST(1 AS BIT)
ELSE CAST(0 AS BIT)
END AS [approved];