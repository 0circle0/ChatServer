use Chat

SELECT R.room, P.publicKey
FROM Rooms R, PersonRooms PR, Person P
WHERE R.id = PR.roomId
  AND PR.personId = P.id
  AND R.admin = (SELECT id FROM Person WHERE publicKey = '${publicKey}')
  AND PR.accessGranted = 0;