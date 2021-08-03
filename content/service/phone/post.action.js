import UserSession from "../../../src/user/UserSession";
import path from "path";
import fs from "fs";
module.exports = function PostAction(form, req) {
    // Load form inputs
    let inputEmail = form.elements.email;
    let inputFileName = form.elements.fileName;

    // Handle Validations

    // Check for active session
    const userSession = new UserSession(req.session);
    if (userSession.isActive()) {
        const localUser = userSession.getLocalUser();

        // Auto fill fileName parameter
        if (!inputFileName.value) {
            inputFileName.value = findAvailableFile(localUser);
        } else {
            if(localUser.hasFile(inputFileName.value)) {
                inputFileName.setCustomValidity("Please choose a unique file name.");
            }
        }
    } else {
        // Email field may need to be set enabled and required
        inputEmail.required = true;
        inputEmail.disabled = false;
        inputEmail.setCustomValidity("Please Register or Log in to become a phone sponsor.");
    }

    const fileName = inputFileName.value;

    // Return action as a function
    return function(res) {
        // Perform Action
        const localUser = userSession.getLocalUser();
        const fileContent = genMarkdownTemplate('./service/phone/request.template.md', req.body);
        localUser.writeFile(fileName, fileContent)

        return {
            message: "Phone Post has been created successfully",
            events: [
                ['redirect', `${process.env.REACT_APP_PATH_SITE}/user/`, 2000],
            ]
        }
    }
}



// Support methods

function genMarkdownTemplate(markdownPath, values) {
    const markdownContentPath = path.join(process.env.REACT_APP_PATH_CONTENT, markdownPath);
    if (!fs.existsSync(markdownContentPath))
        throw new Error("Markdown template not found: " + markdownContentPath);
    let markdownContent = fs.readFileSync(markdownContentPath, 'utf8');

    // Replace template variables
    markdownContent = markdownContent.replace(/\${([^}]+)}/g, (match, fieldName) => {
        if(values.hasOwnProperty(fieldName)) {
            const value = values[fieldName];
            return value.toString().replace(/<[^>]*>?/gm, '');
        }
        return "";
    })

    return markdownContent.trim();
}


function findAvailableFile(localUser, start=1, end=99) {
    for(let i=start; i<end; i++) {
        let fileName = `phone${i}.md`;
        if(!localUser.hasFile(fileName))
            return fileName;
    }
    return null;
}