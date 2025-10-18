import { JSX } from "react";

// https://feathericons.dev/?search=calendar&iconset=feather&format=strict-tsx
export function Calendar(props: JSX.IntrinsicElements["svg"]) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" {...props}>
            <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    );
}

// https://feathericons.dev/?search=file-text&iconset=feather&format=strict-tsx
export function FileText(props: JSX.IntrinsicElements["svg"]) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

// https://feathericons.dev/?search=download&iconset=feather&format=strict-tsx
export function Download(props: JSX.IntrinsicElements["svg"]) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" {...props}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    );
}

export function AdminButton(props: JSX.IntrinsicElements["img"]) {
    return <img src="./Admin_Button.png" alt="Admin Button" {...props} />;
}

export function EducationButton(props: JSX.IntrinsicElements["img"]) {
    return <img src="./Education (1).png" alt="Education Button" {...props} />;
}

export function HousingButton(props: JSX.IntrinsicElements["img"]) {
    return <img src="./Housing Button.png" alt="Housing Button" {...props} />;
}

export function OverviewButton(props: JSX.IntrinsicElements["img"]) {
    return <img src="./Overview Button.png" alt="Overview Button" {...props} />;
}

export function ReportButton(props: JSX.IntrinsicElements["img"]) {
    return <img src="./Report_Button.png" alt="Report Button" {...props} />;
}

export function SchoolButton(props: JSX.IntrinsicElements["img"]) {
    return <img src="./School_Button.png" alt="School Button" {...props} />;
}
