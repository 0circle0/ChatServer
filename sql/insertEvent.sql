USE Chat

DECLARE @personID UNIQUEIDENTIFIER
DECLARE @eventType VARCHAR(50)
DECLARE @eventDescription VARCHAR(MAX)
DECLARE @ipAddress VARCHAR(50)

-- Assign values to the variables (replace with actual values)
SET @personID = (SELECT id FROM Person WHERE publicKey = @publicKey)
SET @eventType = @eventType
SET @eventDescription = @eventDescription
SET @ipAddress = @ipAddress

-- Insert the event log entry into the EventLog table
INSERT INTO EventLog (personID, eventType, eventTimestamp, eventDescription, ipAddress)
VALUES (@personID, @eventType, GETDATE(), @eventDescription, @ipAddress);