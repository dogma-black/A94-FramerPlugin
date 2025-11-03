import { framer } from "framer-plugin"
import { withPermission } from "./permission-utils"

// --- Helper Functions ---

async function getApiKey(): Promise<string> {
    let apiKey = await framer.getPluginData("gemini_api_key")
    if (!apiKey) {
        apiKey = await withPermission({
            permission: "showPrompt",
            action: async () => framer.showPrompt({
                title: "Enter Gemini API Key",
                message: "Please enter your Google AI Studio API key to proceed. This will be stored securely in your project.",
                placeholder: "API Key",
            }),
        })
        if (apiKey) {
            await withPermission({
                permission: "setPluginData",
                action: async () => framer.setPluginData("gemini_api_key", apiKey),
            })
        } else {
            throw new Error("API Key not provided.")
        }
    }
    return apiKey
}

async function runAgent(
    agentPrompt: string,
    inputData: string,
    signal: AbortSignal,
    model: string // Parámetro para especificar el modelo a usar
): Promise<string> {
    const apiKey = await getApiKey()
    // A public CORS proxy is used to bypass browser restrictions on cross-origin requests.
    const PROXY_URL = "https://cors-proxy.framer.app/"
    // La URL ahora es dinámica para aceptar el modelo especificado por cada agente.
    const API_URL = `${PROXY_URL}https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const fullPrompt = `${agentPrompt}\n\n## DATOS DE ENTRADA:\n\n${inputData}`

    const body = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
            temperature: 0.2, // Lower temperature for more predictable, code-like output
            topP: 0.9,
            topK: 40,
        },
    }

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: signal,
        // @ts-ignore
        targetAddressSpace: "public",
    })

    if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API Error:", errorData)
        throw new Error(
            `Gemini API Error: ${errorData.error?.message || "Unknown error"}`
        )
    }

    const data = await response.json()
    if (!data.candidates || !data.candidates[0].content?.parts[0]?.text) {
        console.error("Unexpected API response:", data)
        throw new Error("Unexpected or empty response from Gemini API.")
    }

    const text = data.candidates[0].content.parts[0].text
    return text.trim().replace(/^```(tsx|json|typescript|javascript)?\s*/, '').replace(/\s*```$/, '')
}

// --- Main Orchestration Logic ---

export const generateComponentCode = async (
    baseCode: string,
    userPrompt: string
): Promise<string> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
        controller.abort()
        framer.showToast({
            variant: "error",
            message: "La operación ha tardado demasiado y ha sido cancelada.",
        })
    }, 180000) // 3-minute timeout

    try {
        // --- INICIO DE LA ORQUESTACIÓN DE AGENTES ---

        // AGENTE 1: Analista de Requisitos (Usa el modelo rápido)
        const agent1Prompt = `Eres un arquitecto de software experto. Tu primera tarea es analizar la entrada del usuario y clasificarla en una de estas categorías: 'tsx_code', 'css_code', 'natural_language_instruction'.
        Basado en esa clasificación, convierte la petición del usuario y el código base en una especificación técnica JSON detallada para un componente de React en Framer.

        **Formato de Salida JSON:**
        - 'componentName': Un nombre adecuado en PascalCase.
        - 'description': Una breve descripción de lo que hace el componente.
        - 'props': Una lista de las props necesarias, con su tipo (string, number, color, boolean) y un valor por defecto.
        - 'animations': Describe las animaciones de 'framer-motion' que se deben aplicar (ej: 'whileHover: { scale: 1.1 }').
        - 'logic': Describe la lógica principal o el comportamiento del componente.
        - 'inputType': La categoría que identificaste ('tsx_code', 'css_code', o 'natural_language_instruction').

        Si la entrada es CSS, úsalo como la base principal para la estructura y estilos. Si es código TSX, úsalo como punto de partida para las modificaciones.

        Tu salida DEBE ser únicamente el objeto JSON, sin explicaciones adicionales.`
        const userInput = `Petición del usuario: "${userPrompt || "N/A"}". Código base o de entrada: ${
            baseCode || "Ninguno, crear desde cero."
        }`
        framer.showToast({ message: "Paso 1: Analizando requisitos (flash)..." })
        const specJson = await runAgent(agent1Prompt, userInput, controller.signal, "gemini-2.5-flash")

        // AGENTE 2: Generador de Código (Usa el modelo potente)
        const agent2Prompt = `Eres un desarrollador experto en Framer y React. Tu tarea es tomar una especificación técnica en JSON y generar un componente de código .tsx funcional y de alta calidad.

        **REQUISITOS OBLIGATORIOS:**
        1.  **Salida Única:** Tu respuesta DEBE ser únicamente el código .tsx. No incluyas explicaciones ni texto adicional.
        2.  **Animaciones:** Usa 'framer-motion' para las animaciones descritas.
        3.  **Property Controls:** Incluye 'addPropertyControls' para todas las props definidas.
        4.  **Exportación por Defecto:** El componente principal DEBE ser exportado como el 'default export' (ej: 'export default function MyComponent(...) { ... }').
        5.  **Calidad:** El código debe ser limpio, eficiente y seguir las mejores prácticas.

        **CONTEXTO TÉCNICO ADICIONAL:**
        - Documentación de Framer: ${JSON.stringify(framerDocuJson)}
        - Ejemplo de alta calidad: ${splashCursorExample}`
        framer.showToast({ message: "Paso 2: Generando código (pro)..." })
        const generatedCode = await runAgent(agent2Prompt, specJson, controller.signal, "gemini-2.5-pro")

        // AGENTE 3: Validador y Refinador de Código (Usa el modelo rápido)
        const agent3Prompt = `Eres un linter de código y un refinador. Tu tarea es tomar un bloque de código .tsx, validar que sea sintácticamente correcto, corregir cualquier error menor, asegurar que las importaciones son correctas y que el formato es limpio. Crucialmente, el componente principal debe tener un 'export default'.

        Tu salida DEBE ser únicamente el código .tsx final y limpio. No añadas comentarios ni explicaciones.`
        framer.showToast({ message: "Paso 3: Validando y refinando (flash)..." })
        const finalCode = await runAgent(agent3Prompt, generatedCode, controller.signal, "gemini-2.5-flash")

        // --- FIN DE LA ORQUESTACIÓN ---

        clearTimeout(timeoutId)

        // Force a default export if the AI fails to include one.
        let codeToReturn = finalCode
        if (!/export\s+default/.test(finalCode)) {
            // Find the first function or class and make it the default export.
            codeToReturn = finalCode.replace(
                /(?:export\s+)?(function|class)\s/,
                "export default $1 "
            )
            framer.showToast({ message: "Nota: Se ha forzado un 'export default' faltante." })
        }

        framer.showToast({ variant: "success", message: "¡Componente generado!" })
        return codeToReturn
    } catch (error) {
        clearTimeout(timeoutId)
        console.error("Error en la orquestación de agentes:", error)
        framer.showToast({
            variant: "error",
            message:
                error instanceof Error ? error.message : "Error desconocido",
        })
        throw error
    }
}

// Se importan los datos de los archivos JSON locales.
import framerDocuJson from "./framer docu.json"

const splashCursorExample = `
import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

export default function SplashCursor(props) {
    // ... (código del efecto de cursor omitido por brevedad) ...
    return null;
}

addPropertyControls(SplashCursor, {
    SIM_RESOLUTION: { type: ControlType.Number, title: "Sim Resolution" },
    // ... (resto de property controls omitidos por brevedad) ...
})
`