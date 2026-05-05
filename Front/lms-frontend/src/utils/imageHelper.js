export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    // remove leading slash if present to avoid double slash
    if (path.startsWith('/')) {
        path = path.substring(1);
    }
    
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    
    // Check if path is just a file but needs /storage/ prefixes (Optional depending on Laravel setup)
    // Often Laravel paths are stored as 'ebooks/abc.jpg' without storage.
    if (!path.startsWith('storage')) {
        path = `storage/${path}`;
    }
    
    return `${baseURL}/${path}`;
};
