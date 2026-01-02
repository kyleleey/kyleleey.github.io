// GLB Viewer using Three.js
// Assumes Three.js, GLTFLoader, and OrbitControls are loaded via script tags

class GLBViewer {
  constructor(containerId, glbPath) {
    this.container = document.getElementById(containerId);
    this.glbPath = glbPath;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;
    this.animationMixer = null;
    this.clock = new THREE.Clock();
    this.animationRunning = false;
    
    // Get scale from data attribute, default to 2.0
    const scaleAttr = this.container.getAttribute('data-scale');
    this.modelScale = scaleAttr ? parseFloat(scaleAttr) : 2.0;
    
    this.init();
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f5f5);

    // Create camera
    // Use offsetWidth/offsetHeight or getBoundingClientRect for hidden elements
    let width = this.container.clientWidth || this.container.offsetWidth || 800;
    let height = this.container.clientHeight || this.container.offsetHeight || 400;
    
    // If container is hidden, use a default size (will be resized when shown)
    if (width === 0 || height === 0) {
      width = 800;
      height = 400;
    }
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Initial position will be set when model loads based on CSS variables
    this.camera.position.set(0, 0, 5);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Enable tone mapping for better color reproduction
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // Add improved lighting setup
    // Ambient light - provides base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // Hemisphere light - simulates sky and ground reflection for more natural lighting
    // const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    // hemisphereLight.position.set(0, 10, 0);
    // this.scene.add(hemisphereLight);

    // Main directional light - key light
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    this.scene.add(directionalLight1);

    // Secondary directional light - fill light
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 5, -5);
    this.scene.add(directionalLight2);

    // Additional directional light from the front
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight3.position.set(0, 5, 10);
    this.scene.add(directionalLight3);

    // Add orbit controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 20;
    this.controls.enablePan = true;

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation loop immediately (even before model loads)
    this.animate();
    
    // Load GLB model (only if path is provided, otherwise wait for gallery click)
    if (this.glbPath) {
      this.loadModel();
    }
  }

  loadModel(glbPath = null, scale = null) {
    // Check if THREE is available
    if (typeof THREE === 'undefined') {
      console.error('THREE is not defined. Make sure Three.js is loaded.');
      this.container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error: Three.js library not loaded.</p>';
      return;
    }
    
    // Check if GLTFLoader is available
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.error('THREE.GLTFLoader is not defined. Make sure the GLTFLoader script is loaded.');
      console.error('Available THREE properties:', Object.keys(THREE).filter(k => k.includes('Loader')));
      this.container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error: GLTFLoader library not loaded. Please check the script includes.<br><small>Check browser console for available loaders.</small></p>';
      return;
    }
    
    // Update path and scale if provided
    if (glbPath) {
      this.glbPath = glbPath;
    }
    if (scale !== null) {
      this.modelScale = scale;
    }
    
    // Remove existing model if any
    if (this.model) {
      this.scene.remove(this.model);
      // Dispose of geometry and materials
      this.model.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.map) mat.map.dispose();
                mat.dispose();
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
            }
          }
        }
      });
      this.model = null;
    }
    
    // Stop existing animations
    if (this.animationMixer) {
      this.animationMixer.stopAllAction();
      this.animationMixer = null;
    }
    
    // Show loading indicator (don't remove canvas)
    const existingCanvas = this.container.querySelector('canvas');
    let loadingDiv = this.container.querySelector('.glb-loading');
    if (!loadingDiv) {
      loadingDiv = document.createElement('div');
      loadingDiv.className = 'glb-loading';
      loadingDiv.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: rgba(245, 245, 245, 0.9); z-index: 10; color: #666;';
      loadingDiv.innerHTML = '<p>Loading 3D model...</p>';
      this.container.appendChild(loadingDiv);
    }
    
    console.log('Loading GLB from path:', this.glbPath);
    const loader = new THREE.GLTFLoader();
    
    loader.load(
      this.glbPath,
      (gltf) => {
        // Remove loading indicator
        const loadingDiv = this.container.querySelector('.glb-loading');
        if (loadingDiv) {
          loadingDiv.remove();
        }
        
        this.model = gltf.scene;
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        console.log('Model bounding box:', { center, size, maxDim });
        
        // Only scale if model has valid dimensions
        if (maxDim > 0) {
          const scale = this.modelScale / maxDim;
          this.model.scale.multiplyScalar(scale);
          this.model.position.sub(center.multiplyScalar(scale));
        } else {
          console.warn('Model has zero dimensions, using default scale');
          this.model.scale.set(1, 1, 1);
          this.model.position.set(0, 0, 0);
        }
        
        // Enable shadows
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        this.scene.add(this.model);
        
        // Handle animations if present
        if (gltf.animations && gltf.animations.length > 0) {
          this.animationMixer = new THREE.AnimationMixer(this.model);
          gltf.animations.forEach((clip) => {
            this.animationMixer.clipAction(clip).play();
          });
        }
        
        // Calculate camera position based on model bounds
        const newBox = new THREE.Box3().setFromObject(this.model);
        const newCenter = newBox.getCenter(new THREE.Vector3());
        const newSize = newBox.getSize(new THREE.Vector3());
        const maxSize = Math.max(newSize.x, newSize.y, newSize.z);
        
        // Get camera elevation and azimuth from CSS variables
        const computedStyle = window.getComputedStyle(this.container);
        const elevation = parseFloat(computedStyle.getPropertyValue('--camera-elevation')) || 30; // degrees, default 30
        const azimuth = parseFloat(computedStyle.getPropertyValue('--camera-azimuth')) || 45; // degrees, default 45
        const distance = maxSize * 2.5;
        
        // Convert elevation and azimuth to radians
        const elevationRad = (elevation * Math.PI) / 180;
        const azimuthRad = (azimuth * Math.PI) / 180;
        
        // Calculate camera position using spherical coordinates
        // Azimuth: rotation around Y axis (horizontal)
        // Elevation: angle from horizontal plane (vertical)
        const camPosX = newCenter.x + distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
        const camPosY = newCenter.y + distance * Math.sin(elevationRad);
        const camPosZ = newCenter.z + distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
        
        this.camera.position.set(camPosX, camPosY, camPosZ);
        this.camera.lookAt(newCenter);
        this.camera.updateProjectionMatrix();
        
        if (this.controls) {
          this.controls.target.copy(newCenter);
          this.controls.update();
        }
        
        // Ensure animation loop is running
        if (!this.animationRunning) {
          this.animate();
        }
        
        // Force a render
        this.renderer.render(this.scene, this.camera);
        
        console.log('Model loaded and added to scene. Camera position:', this.camera.position);
      },
      (progress) => {
        // Loading progress (optional)
        if (progress && progress.total > 0) {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        }
      },
      (error) => {
        console.error('Error loading GLB file:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          type: error?.type,
          target: error?.target,
          path: this.glbPath
        });
        
        let errorMsg = 'Unknown error';
        if (error) {
          if (error.message) {
            errorMsg = error.message;
          } else if (error.target && error.target.status) {
            errorMsg = `HTTP ${error.target.status}: ${error.target.statusText || 'Failed to load file'}`;
          } else if (typeof error === 'string') {
            errorMsg = error;
          }
        }
        
        this.container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error loading 3D model: ' + errorMsg + '<br>Path: ' + this.glbPath + '<br><small>Check browser console for more details.</small></p>';
      }
    );
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationRunning = true;
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    if (this.animationMixer) {
      this.animationMixer.update(delta);
    }
    
    if (this.controls) {
      this.controls.update();
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Initialize viewer when DOM and scripts are ready
function initGLBViewers() {
  // Wait for Three.js and loaders to be available
  if (typeof THREE === 'undefined') {
    setTimeout(initGLBViewers, 100);
    return;
  }
  
  // Check if GLTFLoader is available (it might load after THREE)
  if (typeof THREE.GLTFLoader === 'undefined') {
    setTimeout(initGLBViewers, 100);
    return;
  }
  
  // Initialize GLB viewers for carousel
  const viewerContainers = document.querySelectorAll('.glb-viewer-container.glb-viewer-item');
  const viewerInstances = new Map();
  let currentIndex = 0;
  
  viewerContainers.forEach((container, index) => {
    if (!container.hasAttribute('data-viewer-initialized')) {
      container.setAttribute('data-viewer-initialized', 'true');
      
      // Set height from data attribute if provided
      const heightAttr = container.getAttribute('data-height');
      if (heightAttr) {
        if (heightAttr === 'small' || heightAttr === 'medium' || heightAttr === 'large' || heightAttr === 'tall') {
          // Predefined sizes are handled by CSS
        } else if (!isNaN(heightAttr)) {
          container.style.height = heightAttr + 'px';
        } else {
          container.style.height = heightAttr;
        }
      }
      
      // Get GLB path from data attribute
      const initialPath = container.getAttribute('data-glb-path');
      if (initialPath) {
        // Generate unique ID if not present
        if (!container.id) {
          container.id = 'glb-viewer-' + index;
        }
        
        // Temporarily show container to get proper dimensions for initialization
        const wasHidden = !container.classList.contains('active');
        if (wasHidden) {
          container.style.visibility = 'hidden';
          container.style.position = 'absolute';
          container.style.display = 'block';
        }
        
        const viewer = new GLBViewer(container.id, initialPath);
        viewerInstances.set(index, viewer);
        
        // Restore original state if it was hidden
        if (wasHidden) {
          container.style.visibility = '';
          container.style.position = '';
          container.style.display = '';
        }
      }
    }
  });
  
  // Set up carousel navigation
  const prevButton = document.getElementById('glb-carousel-prev');
  const nextButton = document.getElementById('glb-carousel-next');
  const indicatorsContainer = document.getElementById('glb-carousel-indicators');
  
  // Create indicators
  if (indicatorsContainer && viewerContainers.length > 0) {
    viewerContainers.forEach((_, index) => {
      const indicator = document.createElement('div');
      indicator.className = 'glb-carousel-indicator' + (index === 0 ? ' active' : '');
      indicator.setAttribute('data-index', index);
      indicator.addEventListener('click', () => goToSlide(index));
      indicatorsContainer.appendChild(indicator);
    });
  }
  
  function updateCarousel() {
    viewerContainers.forEach((container, index) => {
      if (index === currentIndex) {
        container.classList.add('active');
        const indicator = indicatorsContainer?.querySelector(`[data-index="${index}"]`);
        if (indicator) indicator.classList.add('active');
        
        // Resize the viewer when it becomes active (in case it was initialized while hidden)
        const viewer = viewerInstances.get(index);
        if (viewer && viewer.renderer) {
          // Small delay to ensure container is visible
          setTimeout(() => {
            const width = container.clientWidth || container.offsetWidth || 800;
            const height = container.clientHeight || container.offsetHeight || 400;
            
            if (width > 0 && height > 0) {
              viewer.camera.aspect = width / height;
              viewer.camera.updateProjectionMatrix();
              viewer.renderer.setSize(width, height);
              viewer.renderer.render(viewer.scene, viewer.camera);
            }
          }, 50);
        }
      } else {
        container.classList.remove('active');
        const indicator = indicatorsContainer?.querySelector(`[data-index="${index}"]`);
        if (indicator) indicator.classList.remove('active');
      }
    });
  }
  
  function goToSlide(index) {
    if (index >= 0 && index < viewerContainers.length) {
      currentIndex = index;
      updateCarousel();
    }
  }
  
  function nextSlide() {
    currentIndex = (currentIndex + 1) % viewerContainers.length;
    updateCarousel();
  }
  
  function prevSlide() {
    currentIndex = (currentIndex - 1 + viewerContainers.length) % viewerContainers.length;
    updateCarousel();
  }
  
  if (prevButton) {
    prevButton.addEventListener('click', prevSlide);
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', nextSlide);
  }
  
  // Initialize with first slide active
  if (viewerContainers.length > 0) {
    updateCarousel();
  }
}

// Try to initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGLBViewers);
} else {
  // DOM is already ready
  initGLBViewers();
}

