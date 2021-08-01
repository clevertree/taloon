import UserSession from "../../../src/user/UserSession";
module.exports = function PostAction(req, res, form) {
    const validations = {};
    const autofillValues = {};


    // Handle Validations


    // Check for active session
    const userSession = new UserSession(req.session);
    if (userSession.isActive()) {
        const localUser = userSession.getLocalUser();

        // Auto fill fileName parameter
        if (!req.body.fileName) {
            autofillValues.fileName = findAvailableFile(localUser);
        } else {
            if(localUser.hasFile(req.body.fileName))
                validations.fileName = "Please choose a unique file name";
        }
    } else {
        validations['email'] = "Please Register or Log in to become a phone sponsor.";
    }


    // Return Validations on Preview
    if (req.query.preview)
        return res.status(202).send({validations, values: autofillValues, preview: true});

    // Return Error on failed validation
    if (Object.values(validations).length > 0 || !form.checkValidity())
        return res.status(400).send({validations, values: autofillValues, preview: !!req.query.preview});

    // Perform Action
    const localUser = userSession.getLocalUser();
    const fileContent = genMarkdownTemplate(req.body);
    localUser.writeFile(req.body.fileName, fileContent)

    return res.send({
        message: "Form submitted successfully. Redirecting...",
        events: [
            ['redirect', '/service/phone/list.md', 6000]
        ]
    });
}


// TODO: customize form for accepting phone requests
function genMarkdownTemplate(values) {
    return `
# ${values.title}

${values.description}

<form action="/service/phone/request.action.js">
  <fieldset>
    <legend>Your Request Title</legend>
    <label title="Title">
        <input type="text" name="title" id="title" placeholder="I need a smart phone (and optionally call/text service)" required />
    </label>
  </fieldset>
  <fieldset>
    <legend>Write a Description</legend>
    <label title="Description">
        <textarea name="description" id="description" rows="24" placeholder="I need a phone with service for employment purposes." required></textarea>
    </label>
  </fieldset>
  <fieldset>
    <legend>Submit a new Phone Request</legend>
    <button type="submit">Submit</button>
  </fieldset>
</form>
    `.trim();
}


function findAvailableFile(localUser, start=1, end=99) {
    for(let i=start; i<end; i++) {
        let fileName = `phone${i}.md`;
        if(!localUser.hasFile(fileName))
            return fileName;
    }
    return null;
}