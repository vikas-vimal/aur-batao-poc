const UsersDB = new Map();
UsersDB.set("1", {
  id: "1",
  name: "Viii User",
  credits: 10,
});
UsersDB.set("2", {
  id: "2",
  name: "Second User",
  credits: 20,
});
UsersDB.set("3", {
  id: "3",
  name: "Third User",
  credits: 15,
});
UsersDB.set("4", {
  id: "4",
  name: "Fourth User",
  credits: 10,
});

module.exports.UsersDB = UsersDB;
