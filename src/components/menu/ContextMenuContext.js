import React from "react";

// const unimplemented = function() { throw new Error("MenuContext Object is unimplemented")};
const ContextMenuContext = React.createContext({
    overlay: null,
    parentMenu: null
});

export default ContextMenuContext;
