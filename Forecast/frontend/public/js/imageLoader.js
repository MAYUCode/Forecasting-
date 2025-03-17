class ImageLoader {
    constructor() {
        this.loadedImages = new Map();
        this.loadingPromises = new Map();
    }

    async preloadImages(imageUrls) {
        const promises = imageUrls.map(url => this.loadImage(url));
        return Promise.all(promises);
    }

    loadImage(url) {
        if (this.loadedImages.has(url)) {
            return Promise.resolve(this.loadedImages.get(url));
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.loadedImages.set(url, img);
                this.loadingPromises.delete(url);
                resolve(img);
            };

            img.onerror = () => {
                this.loadingPromises.delete(url);
                reject(new Error(`Failed to load image: ${url}`));
            };

            img.src = url;
        });

        this.loadingPromises.set(url, promise);
        return promise;
    }

    getImage(url) {
        return this.loadedImages.get(url);
    }

    isImageLoaded(url) {
        return this.loadedImages.has(url);
    }

    clearCache() {
        this.loadedImages.clear();
        this.loadingPromises.clear();
    }
}

// Initialize image loader
const imageLoader = new ImageLoader();

// Preload essential images
imageLoader.preloadImages([
    dashboardImages.logo,
    dashboardImages.defaultAvatar,
    dashboardImages.loadingSpinner,
    dashboardImages.success,
    dashboardImages.warning,
    dashboardImages.error,
    dashboardImages.pending
]).catch(error => {
    console.error('Failed to preload images:', error);
});

export default imageLoader; 