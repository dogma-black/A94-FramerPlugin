import "framer-plugin/framer.css"

import React from "react"
import ReactDOM from "react-dom/client"
import { framer } from "framer-plugin"
import { App } from "./App.tsx"

// Announce the UI is ready and set the initial size
framer.showUI({
    width: 340,
    height: 500,
})

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
