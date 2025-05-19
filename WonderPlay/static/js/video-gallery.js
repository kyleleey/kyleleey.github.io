const VideoGallery = (function() {
    function handleVideoSwitch(galleryId, index, galleryType) {
        const container = document.getElementById(galleryId);
        const items = container.querySelectorAll('.video-gallery-item');
        
        if (galleryType === 'results') {
            // For Results section: simple one-to-one mapping
            const sceneButtons = container.parentElement.querySelector('.video-gallery-buttons').querySelectorAll('.scene-button');
            
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                    const video = item.querySelector('video');
                    if (video) {
                        video.currentTime = 0;
                        video.muted = true;
                        video.play().catch(error => {
                            console.log("Autoplay was prevented:", error);
                        });
                    }
                } else {
                    item.classList.remove('active');
                    const video = item.querySelector('video');
                    if (video) {
                        video.pause();
                        video.currentTime = 0;
                    }
                }
            });

            // Update scene buttons
            sceneButtons.forEach(btn => btn.classList.remove('is-primary'));
            sceneButtons[index].classList.add('is-primary');
            
        } else if (galleryType === 'diff-actions') {
            // For Different Actions section
            const textButtons = container.parentElement.querySelector('#gallery-buttons-diff-actions').querySelectorAll('.button');
            const sceneButtons = container.parentElement.querySelector('#gallery-buttons-diff-actions-scenes').querySelectorAll('.scene-button');

            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                    const video = item.querySelector('video');
                    if (video) {
                        video.currentTime = 0;
                        video.muted = true;
                        video.play().catch(error => {
                            console.log("Autoplay was prevented:", error);
                        });
                    }
                } else {
                    item.classList.remove('active');
                    const video = item.querySelector('video');
                    if (video) {
                        video.pause();
                        video.currentTime = 0;
                    }
                }
            });

            // Update buttons
            textButtons.forEach(btn => btn.classList.remove('is-primary'));
            sceneButtons.forEach(btn => btn.classList.remove('is-primary'));
            
            const actionIndex = index % 4;
            const sceneIndex = Math.floor(index / 4);
            
            textButtons[actionIndex].classList.add('is-primary');
            sceneButtons[sceneIndex].classList.add('is-primary');
        } else if (galleryType === 'comparisons') {
            // For Comparisons section
            const methodButtons = container.parentElement.querySelector('#gallery-buttons-nvs').querySelectorAll('.button');
            const sceneButtons = container.parentElement.querySelectorAll('.scene-button');

            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                    const video = item.querySelector('video');
                    if (video) {
                        video.currentTime = 0;
                        video.muted = true;
                        video.play().catch(error => {
                            console.log("Autoplay was prevented:", error);
                        });
                    }
                } else {
                    item.classList.remove('active');
                    const video = item.querySelector('video');
                    if (video) {
                        video.pause();
                        video.currentTime = 0;
                    }
                }
            });

            // Update buttons
            methodButtons.forEach(btn => btn.classList.remove('is-primary'));
            sceneButtons.forEach(btn => btn.classList.remove('is-primary'));
            
            const methodIndex = index % 4;
            const sceneIndex = Math.floor(index / 4);
            
            if (methodButtons[methodIndex]) methodButtons[methodIndex].classList.add('is-primary');
            if (sceneButtons[sceneIndex]) sceneButtons[sceneIndex].classList.add('is-primary');
        }
    }

    function initGallery(galleryButtonsId, galleryCarouselId, galleryType) {
        const container = document.getElementById(galleryCarouselId);
        if (!container) return;

        // Ensure all videos are loaded and ready
        const videos = container.querySelectorAll('.video-gallery-item video');
        videos.forEach(video => {
            video.load();
            video.muted = true;
        });

        if (galleryType === 'results') {
            // Handle Results section
            const sceneButtons = document.getElementById(galleryButtonsId).querySelectorAll('.scene-button');
            sceneButtons.forEach((button, index) => {
                button.addEventListener('click', () => {
                    handleVideoSwitch(galleryCarouselId, index, 'results');
                });
            });
        } else if (galleryType === 'diff-actions') {
            // Handle Different Actions section
            const textButtons = document.getElementById('gallery-buttons-diff-actions').querySelectorAll('.button');
            const sceneButtons = document.getElementById('gallery-buttons-diff-actions-scenes').querySelectorAll('.scene-button');

            textButtons.forEach((button, actionIdx) => {
                button.addEventListener('click', () => {
                    const activeItem = container.querySelector('.video-gallery-item.active');
                    const currentIndex = Array.from(container.querySelectorAll('.video-gallery-item')).indexOf(activeItem);
                    const currentSceneIndex = Math.floor(currentIndex / 4);
                    const newIndex = currentSceneIndex * 4 + actionIdx;
                    handleVideoSwitch(galleryCarouselId, newIndex, 'diff-actions');
                });
            });

            sceneButtons.forEach((button, sceneIdx) => {
                button.addEventListener('click', () => {
                    const activeItem = container.querySelector('.video-gallery-item.active');
                    const currentIndex = Array.from(container.querySelectorAll('.video-gallery-item')).indexOf(activeItem);
                    const currentActionIndex = currentIndex % 4;
                    const newIndex = sceneIdx * 4 + currentActionIndex;
                    handleVideoSwitch(galleryCarouselId, newIndex, 'diff-actions');
                });
            });
        } else if (galleryType === 'comparisons') {
            // Handle Comparisons section
            const methodButtons = document.getElementById('gallery-buttons-nvs').querySelectorAll('.button');
            const sceneButtons = container.parentElement.querySelectorAll('.scene-button');

            methodButtons.forEach((button, methodIdx) => {
                button.addEventListener('click', () => {
                    const activeItem = container.querySelector('.video-gallery-item.active');
                    const currentIndex = Array.from(container.querySelectorAll('.video-gallery-item')).indexOf(activeItem);
                    const currentSceneIndex = Math.floor(currentIndex / 4);
                    const newIndex = currentSceneIndex * 4 + methodIdx;
                    handleVideoSwitch(galleryCarouselId, newIndex, 'comparisons');
                });
            });

            sceneButtons.forEach((button, sceneIdx) => {
                button.addEventListener('click', () => {
                    const activeItem = container.querySelector('.video-gallery-item.active');
                    const currentIndex = Array.from(container.querySelectorAll('.video-gallery-item')).indexOf(activeItem);
                    const currentMethodIndex = currentIndex % 4;
                    const newIndex = sceneIdx * 4 + currentMethodIndex;
                    handleVideoSwitch(galleryCarouselId, newIndex, 'comparisons');
                });
            });
        }

        // Play the first video
        const firstVideo = container.querySelector('.video-gallery-item.active video');
        if (firstVideo) {
            firstVideo.muted = true;
            firstVideo.play().catch(error => {
                console.log("Initial autoplay was prevented:", error);
            });
        }
    }

    return {
        init: function() {
            // Initialize results gallery
            initGallery('gallery-buttons-results', 'gallery-carousel-results', 'results');
            
            // Initialize different actions gallery
            initGallery('gallery-buttons-diff-actions', 'gallery-carousel-diff-actions', 'diff-actions');
            
            // Initialize comparison gallery
            initGallery('gallery-buttons-nvs', 'gallery-carousel-nvs', 'comparisons');
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    VideoGallery.init();
});