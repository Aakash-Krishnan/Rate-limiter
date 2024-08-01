const ipStore = {};
const BLOCk_DURATION = 1000 * 10;
const RATE_LIMIT_PER_MIN = 10;

const rateLimiter = (ip) => {
  const currentTime = Date.now();
  if (ipStore[ip] && ipStore[ip].blockDuration > currentTime) {
    return true;
  }

  if (!ipStore[ip]) {
    ipStore[ip] = {
      rate: 1,
      firstReqTime: currentTime,
    };
    return false;
  } else {
    const interval = currentTime - ipStore[ip].firstReqTime;

    if (interval > BLOCk_DURATION) {
      ipStore[ip].rate = 1;
      ipStore[ip].firstReqTime = currentTime;

      return false;
    } else {
      ipStore[ip].rate += 1;

      if (ipStore[ip].rate > RATE_LIMIT_PER_MIN) {
        ipStore[ip].blockDuration = currentTime + BLOCk_DURATION;
        return true;
      }
    }
  }
};

module.exports = rateLimiter;
