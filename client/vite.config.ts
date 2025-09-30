import path from "path" // <-- ДОБАВЬ ЭТОТ ИМПОРТ
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [react()],
    /* === НАЧАЛО ВАЖНЫХ ИЗМЕНЕНИЙ === */
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    /* === КОНЕЦ ВАЖНЫХ ИЗМЕНЕНИЙ === */
})