// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Prevent tests from reaching main server
process.env.REACT_APP_API_PORT = 10001;
process.env.REACT_APP_API_ENDPOINT = "http://localhost:" + process.env.REACT_APP_API_PORT;

// Disable console.log
// jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn());

if(!global.TextEncoder) {
    const {TextEncoder, TextDecoder} = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}