A pull request by  modified the email existence validation logic in the CreateUserService.execute method. This change inverted the intended behavior, causing unit tests to fail and allowing duplicate email addresses to be created, which violates the application's requirements.
Code Change
The PR altered the email existence check in the CreateUserService.execute method:
Original Code:
if (emailExists) {
  throw new AppError('BAD_REQUEST', 'Email alerady exists', 400);
}

Modified Code (PR):
if (!emailExists) {
  throw new AppError('BAD_REQUEST', 'Email alerady exists', 400);
}

Impact
The change inverted the logic:

Original Behavior: The service throws an AppError with a 400 status code when the email already exists, preventing duplicate users, as required.
Modified Behavior: The service now throws an error when the email does not exist, rejecting valid new emails and allowing duplicate emails to be created. This breaks the user creation process and violates the requirement to prevent duplicate email addresses.

 FAIL  src/modules/users/services/createUser/CreateUserService.spec.ts
  CreateUserService
    × Should be able to create a new user with valid email, password, and name (2 ms)
    × Should be able to create a new user with email, password, name, and description (1 ms)
    × Should be able to create a new user with minimal required fields (1 ms)
    × Should create a wallet with initial value of 25000 (1 ms)
    × Should invalidate cache after user creation (1 ms)
    × Should hash the password before saving the user (1 ms)
    × Should create a user with a complex password
    × Should create multiple users sequentially
    × Should return correct response structure
    × Should persist user in repository after successful creation (1 ms)
    √ Should fail when email is missing (2 ms)
    √ Should fail when password is missing (1 ms)
    √ Should throw error when email is an empty string
    √ Should rollback transaction when hash provider throws a generic error (5 ms)
    √ Should fail when both email and password are missing
    × Should fail when email already exists (1 ms)
    √ Should fail when wallet creation throws an error (1 ms)
    √ Should fail when user creation throws an error
    √ Should fail when cache invalidation throws an error (1 ms)
    √ Should fail when hash provider throws an error



