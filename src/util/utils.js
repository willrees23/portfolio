export function gradient({ from, to }) {
    return `h-fit bg-clip-text bg-gradient-to-r ${from} ${to} text-transparent w-fit`;
}

export function gradientDefault({ from, to, className }) {
    return `h-fit bg-clip-text bg-gradient-to-r ${from} ${to} text-transparent w-fit ${className}`;
}