## Submit 2-factor Verification

<form action="login" data-autosubmit>
<input type="hidden" name="service" value="email-2factor-response">
  <fieldset>
    <legend>Your Email</legend>
    <input type="email" name="email" id="email" placeholder="you@email.com" value="${email}" required />
  </fieldset>
  <fieldset>
    <legend>Your 2-factor Code</legend>
    <input type="number" name="code" id="code" placeholder="1234" maxlength="4" value="${code}" required />
  </fieldset>
  <fieldset>
    <legend>Submit 2-Factor Login Code</legend>
    <button type="submit">Submit</button>
  </fieldset>
</form>
