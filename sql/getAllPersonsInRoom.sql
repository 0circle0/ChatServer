USE Chat

DECLARE @roomId uniqueidentifier

SET @roomId = (SELECT id FROM Rooms WHERE room = @room)

SELECT publicKey FROM Person P WHERE EXISTS(
	SELECT id FROM PersonRooms WHERE roomId = @roomId AND P.id = personId
)