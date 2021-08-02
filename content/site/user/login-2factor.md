## Submit 2-factor Verification

Please check your email for a 2-factor authorization code and type it in the form below to start your session.

<form action="login" data-autosubmit>
<input type="hidden" name="service" value="email-2factor-response">
<fieldset>
    <legend>Your Email</legend>
    <label>
        <input type="email" name="email" id="email" placeholder="you@email.com" value="" required />
    </label>
</fieldset>
<fieldset>
    <legend>Your 2-factor Code</legend>
    <label>
        <input type="number" name="code" id="code" placeholder="1234" maxlength="4" value="${code}" required />
    </label>
</fieldset>
<fieldset>
    <legend>Submit 2-Factor Login Code</legend>
    <button type="submit">Submit</button>
</fieldset>
</form>
