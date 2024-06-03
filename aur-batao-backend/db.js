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

module.exports.UsersDB = UsersDB;
