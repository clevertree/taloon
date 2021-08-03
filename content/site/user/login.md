## Log in with Email Verification

Use this form to send a 2-factor code to your email address. 
Once verified, you will be logged in to a new session.

<form action="login.action.js" autosave="off">
<input type="hidden" name="service" value="email">
<fieldset>
    <legend>Your Email</legend>
    <label title="Email">
        <input type="email" name="email" id="email" placeholder="Your Login Email Address" value="" required />
    </label>
</fieldset>
<fieldset>
    <legend>Receive a 2-Factor Login Code</legend>
    <button type="submit">Send Code to my Email</button>
</fieldset>
</form>


## Log in with Google SSO
<form action="login.action.js" autosave="off">
<input type="hidden" name="service" value="google">
<fieldset>
    <legend>Click here to log in with Google SSO</legend>
    <button type="submit">Login with Google</button>
</fieldset>
</form>
