

# Request a Phone Sponsor


```
This section is a work in progress. Please check back soon.
```


<form action="request.action.js">
  <fieldset>
    <legend>Your Request Title</legend>
    <label title="Title">
        <input type="text" name="title" id="title" placeholder="I need a smart phone (and optionally call/text service)" required />
    </label>
    <label title="File Name">
        <input type="text" name="fileName" id="fileName" placeholder="phone.md" required />
    </label>
  </fieldset>
  <fieldset>
    <legend>Is this offer currently Active?</legend>
    <label title="Status">
        <select name="status" id="status">
          <option>Active</option>
          <option>Inactive</option>
        </select>
    </label>
  </fieldset>
  <fieldset>
    <legend>My offer Location</legend>
    <label title="Location">
        <input name="location" id="location" type="text" placeholder="'85210' or 'Mesa, AZ' or '33.4115946,-111.8449462'" />
        <location for="location"></location>
    </label>
    <label title="Distance">
        <input name="distance" id="distance" type="number" placeholder="Within 10 miles" />
    </label>
  </fieldset>
  <fieldset>
    <legend>Write a Description</legend>
    <label title="Description">
        <textarea name="description" id="description" rows="24" placeholder="I need a phone with service for employment purposes" required></textarea>
    </label>
  </fieldset>
  <fieldset>
    <legend>Submit a new Phone Offer</legend>
    <button type="submit">Submit</button>
  </fieldset>
</form>