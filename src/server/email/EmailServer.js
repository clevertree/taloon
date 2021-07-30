import React from "react";
import nodemailer from 'nodemailer'
import Markdown from 'markdown-to-jsx';
import ReactDOMServer from 'react-dom/server';
import path from "path";
import fs from "fs";

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

    static async sendMarkdownTemplateEmail(to, subject, markdownPath, values={}, from=process.env.REACT_APP_EMAIL_FROM) {
        const pathMD = path.resolve(process.env.REACT_APP_PATH_CONTENT, markdownPath);
        if (!fs.existsSync(pathMD))
            throw new Error("Email template not found: " + pathMD);

        let markdownContent = fs.readFileSync(pathMD, 'utf8');
        for(const valueName in values) {
            if(values.hasOwnProperty(valueName)) {
                const value = values[valueName];
                markdownContent = markdownContent.replace(new RegExp(`\{${valueName}\}`, 'g'), value);
                subject = subject.replace(new RegExp(`\{${valueName}\}`, 'g'), value);
            }
        }
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

        const transporter = EmailServer.getTransport();
        const info = await transporter.sendMail(message);
        console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }
}

