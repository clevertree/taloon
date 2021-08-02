# ${title}

${description}

<form action="/service/phone/request.action.js">
  <input type="hidden" name="withinLocation" value="${location}">
  <input type="hidden" name="withinDistance" value="${distance}">
  <fieldset>
    <legend>Your Location</legend>
    <label title="Location">
        <input name="location" id="location" type="text" placeholder="'85210' or 'Mesa, AZ' or '33.4115946,-111.8449462'" required />
        <location for="location"></location>
    </label>
  </fieldset>
  <fieldset>
    <legend>Your Information</legend>
    <label title="Your Email">
        <input name="email" id="email" type="text" placeholder="my@email.com" required />
        <session for="email"></session>
    </label>
    <label title="Your Name">
        <input type="text" name="name" id="name" placeholder="Guy Needsaphone" required />
    </label>
    <label title="Your Phone">
        <input name="phone" id="phone" type="text" placeholder="602-432-1234" required />
    </label>
  </fieldset>
  <fieldset>
    <legend>Write a Description</legend>
    <label title="Description">
        <textarea name="description" id="description" rows="12" placeholder="I need a phone with service for employment purposes." required></textarea>
    </label>
  </fieldset>
  <fieldset>
    <legend>Submit a new Phone Request</legend>
    <button type="submit">Submit</button>
  </fieldset>
</form>

```
This page was generated from a template. 
```