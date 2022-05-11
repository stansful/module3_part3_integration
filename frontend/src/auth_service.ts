const form = document.querySelector('#form') as HTMLFormElement;
const signUpButton = document.querySelector('#signUp') as HTMLButtonElement;

const getUserInfo = (): User => {
  const emailInputElement = document.querySelector('#email') as HTMLInputElement;
  const passwordInputElement = document.querySelector('#password') as HTMLInputElement;

  const email = emailInputElement.value;
  const password = passwordInputElement.value;

  return {
    email,
    password,
  };
};

const validate = (user: User) => {
  const emailRegex = /\w+@\w+\.[a-z]+/;
  const passwordRegex = /\w{8,}/;

  const emailMatch = user.email.match(emailRegex);
  const passwordMatch = user.password.match(passwordRegex);

  return Boolean(emailMatch && passwordMatch);
};

const signUpEvent = async (event: Event) => {
  event.preventDefault();

  const user = getUserInfo();
  const valid = validate(user);
  if (!valid) {
    return alert(VALIDATION_FAILED);
  }

  const response: Message | ErrorMessage = await apiRequest.post(`/auth/signUp`, user);

  if ('errorMessage' in response) {
    return alert(response.errorMessage);
  }
  if ('message' in response) {
    return alert(response.message);
  }
};

const signInEvent = async (event: Event) => {
  event.preventDefault();

  const user = getUserInfo();
  const valid = validate(user);

  if (!valid) {
    return alert(VALIDATION_FAILED);
  }

  const response: Token | ErrorMessage = await apiRequest.post(`/auth/signIn`, user);

  if ('errorMessage' in response) {
    return alert(response.errorMessage);
  }
  if ('token' in response) {
    setToken(response.token);
  }

  signUpButton.removeEventListener(EVENT_TYPES.click, signUpEvent);
  form.removeEventListener(EVENT_TYPES.submit, signInEvent);
  document.location.replace('./gallery.html');
};

signUpButton.addEventListener(EVENT_TYPES.click, signUpEvent);
form.addEventListener(EVENT_TYPES.submit, signInEvent);
