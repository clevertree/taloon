import React from "react";
import nodemailer from 'nodemailer'
import Markdown from 'markdown-to-jsx';
import ReactDOMServer from 'react-dom/server';
import path from "path";
import fs from "fs";

export default class EmailServer {

    static setupRoutes(app) {
        this.app = app;

        // app.post(':email-validation', (req, res, next) => {
        //     return this.handleEmailValidation(req, res, next);
        // });
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

    static async sendMarkdownTemplateEmail(to, subject, markdownPath, replaceParams={}, from=process.env.REACT_APP_EMAIL_FROM) {
        const pathMD = path.resolve(process.env.REACT_APP_PATH_CONTENT, markdownPath);
        if (!fs.existsSync(pathMD))
            throw new Error("Email template not found: " + pathMD);

        let markdownContent = fs.readFileSync(pathMD, 'utf8');


        // Replace template variables
        markdownContent = markdownContent.replace(/\${([^}]+)}/g, (match, fieldName) => {
            // console.log({match, fieldName})
            if(replaceParams.hasOwnProperty(fieldName)) {
                const value = replaceParams[fieldName];
                return value.toString().replace(/<[^>]*>?/gm, '');
            }
            return "";
        })

        await EmailServer.sendMarkdownEmail(to, subject, markdownContent)
    }

    static async sendMarkdownEmail(to, subject, markdownContent, from=process.env.REACT_APP_EMAIL_FROM) {
        const html = ReactDOMServer.renderToString(React.createElement(Markdown, {}, markdownContent))
        const message = {
            from,
            to,
            subject,
            text: markdownContent,
            html,
        }

        if(process.env.NODE_ENV === 'production') {
            const transporter = EmailServer.getTransport();
            const info = await transporter.sendMail(message);
            console.log(`Email sent to ${to}: ${subject}`, info);
        } else {
            console.warn(`Sending email disabled when NODE_ENV!=production. Message:`, message);
        }
    }
}

