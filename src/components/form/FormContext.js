// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
import React from "react";

export const FormContext = React.createContext({
    errors: {}
});