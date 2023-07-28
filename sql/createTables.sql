Use Chat
-- Drop the PersonRooms table
DROP TABLE IF EXISTS PersonRooms;

-- Drop the Rooms table
DROP TABLE IF EXISTS Rooms;

-- Drop the EventLog table
DROP TABLE IF EXISTS EventLog;

-- Drop the Person table
DROP TABLE IF EXISTS Person;

CREATE TABLE Person (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    publicKey VARCHAR(450) NOT NULL,
	lastSeen DATETIME NOT NULL DEFAULT GETDATE(),
	isAllowed BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_Person_publicKey UNIQUE (publicKey)
);

CREATE TABLE Rooms (
	id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
	room VARCHAR(20) NOT NULL,
	admin UNIQUEIDENTIFIER NOT NULL,
	FOREIGN KEY (admin) REFERENCES Person (id),
	CONSTRAINT UQ_Rooms_room UNIQUE (room)
);

CREATE TABLE PersonRooms (
	roomId UNIQUEIDENTIFIER NOT NULL,
	personId UNIQUEIDENTIFIER NOT NULL,
	accessGranted BIT NOT NULL,
	PRIMARY KEY (roomId, personId),
	FOREIGN KEY (roomId) REFERENCES Rooms (id),
	FOREIGN KEY (personId) REFERENCES Person (id)
);

CREATE TABLE EventLog (
    eventID INT IDENTITY(1,1) PRIMARY KEY,
    personID UNIQUEIDENTIFIER DEFAULT NULL,
    eventType VARCHAR(50),
    eventTimestamp DATETIME NOT NULL DEFAULT GETDATE(),
    eventDescription VARCHAR(MAX),
    ipAddress VARCHAR(50),
    FOREIGN KEY (personID) REFERENCES Person(id)
);