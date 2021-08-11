

# Become a Phone Sponsor


```
This section is a work in progress. Please check back soon.
```


<form action="post.js">
  <fieldset>
    <legend>Your Account</legend>
    <label title="Email">
        <input name="email" type="text" placeholder="my@email.com" disabled required/>
        <session for="email"></session>
    </label>
  </fieldset>
  <fieldset>
    <legend>Your Offer Title</legend>
    <label title="Title">
        <input type="text" name="title" placeholder="Offering Nexus5X with Sim (Text & Talk)" required />
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
        <input name="location" type="text" placeholder="'85210' or 'Mesa, AZ' or '33.4115946,-111.8449462'" required />
        <location for="location"></location>
    </label>
    <label title="Distance (mi.)">
        <input name="distance" type="number" placeholder="10 (miles)" value="10" />
    </label>
  </fieldset>
  <fieldset>
    <legend>Write a Description</legend>
    <label title="Description">
        <textarea name="description" rows="12" placeholder="Enter a description" required></textarea>
    </label>
  </fieldset>
  <fieldset>
    <legend>Submit a new Phone Offer</legend>
    <button type="submit">Submit</button>
  </fieldset>
</form>

# Existing Offers

[Search or manage existing offers](index.md)