const setToken = (token: string, timeToLive: number = TOKEN_TIME_TO_LIVE_IN_MINUTES) => {
  localStorage.setItem(TOKEN, token);
  setTokenExpirationTime(timeToLive);
};

const setTokenExpirationTime = (minutes: number) => {
  const expirationTimeInMilliSeconds = minutes * 60 * 1000;
  localStorage.setItem(TOKEN_EXPIRES_TIME, `${expirationTimeInMilliSeconds}`);
};

const getTokenExpirationTime = () => {
  return Number(localStorage.getItem(TOKEN_EXPIRES_TIME));
};

const getToken = (): string => {
  const token = localStorage.getItem(TOKEN);
  return token ? token : '';
};

const removeToken = () => {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(TOKEN_EXPIRES_TIME);
};

const removeTokenWithTimeout = () => {
  const expiresTime = getTokenExpirationTime();
  setTimeout(() => {
    redirectToIndex();
  }, expiresTime);
};
