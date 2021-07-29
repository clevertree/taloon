import React from "react";
import nodemailer from 'nodemailer'
import Markdown from 'markdown-to-jsx';
import ReactDOMServer from 'react-dom/server';

export default class EmailServer {

    static handleEmailValidation(req, res, next) {
        return undefined;
    }

    static setupRoutes(app) {
        this.app = app;

        app.post(':email-validation', (req, res, next) => {
            return this.handleEmailValidation(req, res, next);
        });
    }

    static getConfig() {
        return {
            host: process.env.REACT_APP_EMAIL_HOST,
            port: process.env.REACT_APP_EMAIL_PORT,
            auth: {
                user: process.env.REACT_APP_EMAIL_USER,
                pass: process.env.REACT_APP_EMAIL_PASS
            }
        };
    }

    static getTransport() {
        return nodemailer.createTransport(EmailServer.getConfig());
    }

    static async sendMarkdownEmail(to, subject, mdContent, from=process.env.REACT_APP_EMAIL_FROM) {
        const html = ReactDOMServer.renderToString(React.createElement(Markdown, {}, mdContent))
        const message = {
            from,
            to,
            subject,
            text: mdContent,
            html,
        }

        const transporter = EmailServer.getTransport();
        const info = await transporter.sendMail(message);
        console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }
}

