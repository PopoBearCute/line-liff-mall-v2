import * as React from "react"
import { SVGProps } from "react"

const StoreSvg = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        {...props}
    >
        {/* Base Circle */}
        <circle cx="50" cy="50" r="48" fill="#00519E" stroke="white" strokeWidth="4" />

        {/* Store Base */}
        <path
            d="M25 50 V75 C25 78.313 27.686 81 31 81 H69 C72.314 81 75 78.313 75 75 V50"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* Store Door */}
        <path
            d="M43 81 V65 C43 61.134 46.134 58 50 58 C53.866 58 57 61.134 57 65 V81"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* Awning Left (Red) */}
        <path
            d="M26 38 L22 50 C22 53 25 56 29 55 C32 54 34 51 34 51 L36 38 Z"
            fill="#D42029"
        />

        {/* Awning Middle (White/Cream) */}
        <path
            d="M36 38 L34 51 C34 51 38 56 43 56 C48 56 50 53 50 53 C50 53 52 56 57 56 C62 56 66 51 66 51 L64 38 Z"
            fill="#F5EFE6"
        />

        {/* Awning Right (Light Blue) */}
        <path
            d="M64 38 L66 51 C66 51 68 54 71 55 C75 56 78 53 78 50 L74 38 Z"
            fill="#4FA5F0"
        />

        {/* Awning Top Bar */}
        <path
            d="M25 38 L75 38"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

export default StoreSvg
