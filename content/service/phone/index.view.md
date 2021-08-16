
# Search for a Phone Sponsor


```
This section is a work in progress. Please check back soon.
```

<form action="index.js">
  <fieldset>
    <legend>Search Keywords</legend>
    <label title="Search">
        <input type="text" name="search" placeholder="Android" />
    </label>
  </fieldset>
  <fieldset>
    <legend>My Location</legend>
    <label title="Location">
        <input name="location" id="location" type="text" placeholder="'85210' or 'Mesa, AZ' or '33.4115946,-111.8449462'" />
        <location for="location"></location>
    </label>
    <label title="Distance">
        <input name="distance" id="distance" type="number" placeholder="Within 10 miles" />
    </label>
  </fieldset>
  <fieldset>
    <legend>Search Phone Offers</legend>
    <button type="submit">Search</button>
  </fieldset>
  <fieldset>
    <legend>Results</legend>
    ${results}
  </fieldset>
</form>


# Become a Phone Sponsor

[Become a Phone Sponsor](post.js)

# Search existing Offers

[Search or manage existing offers](index.js)