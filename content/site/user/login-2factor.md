## Submit 2-factor Verification

<form action="login" data-autofill data-autosubmit>
<input type="hidden" name="service" value="email-2factor-response">
  <fieldset>
    <legend>Your Email</legend>
    <input type="email" name="email" id="email" placeholder="you@email.com" required />
  </fieldset>
  <fieldset>
    <legend>Your 2-factor Code</legend>
    <input type="number" name="code" id="code" placeholder="1234" maxlength="4" required />
  </fieldset>
  <fieldset>
    <legend>Submit 2-Factor Login Code</legend>
    <button type="submit">Submit</button>
  </fieldset>
</form>
