{/* this hook is used to check if the component is mounted */}
import { useState, useEffect } from 'react';

export default function useMounted() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}