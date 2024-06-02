const rooms = new Map();

function generateRoomId(fromUser, targetUser) {
  console.log("evaluating room id for users", fromUser, targetUser);
  return fromUser.id < targetUser.id
    ? `${fromUser.id}_${targetUser.id}`
    : `${targetUser.id}_${fromUser.id}`;
}

function getRoomByUserIds(fromUser, targetUser) {
  console.log("Searching for existing room for users", fromUser, targetUser);
  const roomId = generateRoomId(fromUser, targetUser);
  if (!roomId) {
    console.log("Room not found for users", fromUser, targetUser);
    return null;
  }
  return rooms.get(roomId);
}

function createRoom(fromUser, targetUser) {
  const roomId = generateRoomId(fromUser, targetUser);
  const payload = {
    roomId,
    fromUser: { id: fromUser.id, name: fromUser.name },
    targetUser: { id: targetUser.id, name: targetUser.name },
    createdAt: new Date(),
    status: "INITIATED",
  };
  rooms.set(roomId, payload);
  return payload;
}

function deleteRoom(roomId) {
  rooms.delete(roomId);
  return true;
}

module.exports = {
  rooms,
  createRoom,
  generateRoomId,
  getRoomByUserIds,
  deleteRoom,
};
