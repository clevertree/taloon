

# Become a Phone Sponsor


```
This section is a work in progress. Please check back soon.
```


<form action="post.action.js">
  <fieldset>
    <legend>Your Account</legend>
    <label for="title">Email</label>
    <input name="email" id="email" type="text" placeholder="my@email.com" disabled/>
    <session for="email"></session>
  </fieldset>
  <fieldset>
    <legend>Your Offer Title</legend>
    <label for="title">Title</label>
    <input type="text" name="title" id="title" placeholder="Offering Nexus5X with Sim (Text & Talk)" required />
  </fieldset>
  <fieldset>
    <legend>Is this offer currently Active?</legend>
    <label for="status">Status</label>
    <select name="status" id="status">
      <option>Active</option>
      <option>Inactive</option>
    </select>
  </fieldset>
  <fieldset>
    <legend>My offer Location</legend>
    <label for="location">Location</label>
    <input name="location" id="location" type="text" placeholder="'85210' or 'Mesa, AZ' or '33.4115946,-111.8449462'" />
    <location for="location"></location>
  </fieldset>
  <fieldset>
    <legend>Write a Description</legend>
    <label for="description">Description</label>
    <textarea name="description" id="description" rows="24" placeholder="Enter a description" required></textarea>
  </fieldset>
  <fieldset>
    <legend>File Name</legend>
    <label for="fileName">File Name</label>
    <input type="text" name="fileName" id="fileName" placeholder="phone.md" required />
  </fieldset>
  <fieldset>
    <legend>Submit a new Phone Offer</legend>
    <button type="submit">Submit</button>
  </fieldset>
</form>