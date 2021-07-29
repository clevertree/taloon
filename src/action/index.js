import FormHandler from "../components/form/FormHandler";
import LoginEmail from "./user/login-email";
import PhonePost from "./service/phone-post";

FormHandler.addFormActionHandler('user-login-email', LoginEmail);
FormHandler.addFormActionHandler('service/phone-post.js', PhonePost);
