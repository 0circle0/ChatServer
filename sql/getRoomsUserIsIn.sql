Use Chat
declare @userID uniqueidentifier

set @userId = (select id from Person where publicKey = @publicKey)

SELECT room
FROM Rooms R
WHERE EXISTS (
    SELECT 1
    FROM PersonRooms
    WHERE PersonRooms.roomId = R.id
    AND PersonRooms.personId = @userId
    AND PersonRooms.accessGranted = 1
);