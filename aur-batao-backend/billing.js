const { UsersDB } = require("./db");
const ONE_CREDIT_HAS_SECONDS = 60;

function calcCallBill(user, room) {
  console.log("Billing section...", { user, room });
  if (!user?.id || !room?.roomId) {
    console.log("Invalid user or room details provided for billing...");
    return;
  }
  const callStartTime = room?.createdAt ? new Date(room?.createdAt) : null;
  if (!callStartTime) {
    console.log("Unable to get call start time...", room?.createdAt);
    return;
  }
  const currentTime = new Date().valueOf();
  const callDurationSec = (currentTime - callStartTime.valueOf()) / 1000;
  console.log("Billing this call for", callDurationSec, "seconds");
  console.log("User have", user.credits, "credits...");
  console.log(`1 CREDIT = `, ONE_CREDIT_HAS_SECONDS, ` SECONDS`);
  const usedCredits = callDurationSec / ONE_CREDIT_HAS_SECONDS;
  console.log("Bill amount:", usedCredits);
  return usedCredits;
}

module.exports = { calcCallBill };
