## Log in with Email Verification

<form action="login">
<input type="hidden" name="service" value="email">
  <fieldset>
    <legend>Your Email</legend>
    <label for="email">Email</label>
    <input type="email" name="email" id="email" placeholder="Your Login Email Address" defaultValue="${email}" required />
  </fieldset>
  <fieldset>
    <legend>Receive a 2-Factor Login Code</legend>
    <button type="submit">Send Code to my Email</button>
  </fieldset>
</form>


## Log in with Google SSO
<form action="login">
<input type="hidden" name="service" value="google">
  <fieldset>
    <legend>Click here to log in with Google SSO</legend>
    <button type="submit">Login with Google</button>
  </fieldset>
</form>
