const rooms = new Map();

function generateRoomId(fromUser, targetUser) {
  return fromUser.id < targetUser.id
    ? `${fromUser.id}_${targetUser.id}`
    : `${targetUser.id}_${fromUser.id}`;
}

function getRoomByUserIds(fromUser, targetUser) {
  const roomId = generateRoomId(fromUser, targetUser);
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

module.exports = {
  rooms,
  createRoom,
  generateRoomId,
  getRoomByUserIds,
};
