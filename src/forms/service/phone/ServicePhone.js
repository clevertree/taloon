import FormHandler from "../../../components/form/FormHandler";

FormHandler.addFormActionHandler('service-phone-post', ServicePhonePost);

function ServicePhonePost(form, req) {

    return {
        message: "Phone Service posted successfully"
    }
}

export {
    ServicePhonePost
}